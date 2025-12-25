let app = getApp();
Page({
  data: {
    selectYear: '',
    selectMonth: '',
    date: '',          // YYYY-MM，用于月份选择器
    bookList: [],
    incomeAmt: '',
    payAmt: '',
    allMode: false     // 是否显示全部账单
  },
  onLoad: function (options) {
  },
  onShow: function () {
    let dateObj = app.getDateInfo();
    this.initData(dateObj.year, dateObj.month);
  },
  onLongPressBook(e) { // 长按删除账单
    const id = e.currentTarget.dataset.id;
    const _this = this;
    if(!id){
      return;
    }
    
    wx.showActionSheet({
      itemList: ['删除账单'],
      success: (res) => {
        if (res.tapIndex === 0) {
          // 用户点击了删除
          wx.showModal({
            title: '提示',
            content: '确定要删除这条账单吗？',
            confirmText: '删除',
            confirmColor: '#e74c3c',
            success: (res) => {
              if (res.confirm) {
                wx.showLoading({
                  title: '删除中...',
                  mask: true
                });
                
                // 调用云函数删除账单
                wx.cloud.callFunction({
                  name: 'deleteBook',
                  data: { id },
                  success: (res) => {
                    wx.hideLoading();
                    if (res.result && res.result.code === 0) {
                      wx.showToast({
                        title: '删除成功',
                        icon: 'success',
                        duration: 1500
                      });
                      
                      // 更新UI
                      const { selectYear, selectMonth, allMode } = _this.data;
                      if (allMode) {
                        // 如果当前是全部账单模式，重新加载全部数据
                        _this.showAll();
                      } else {
                        // 否则只刷新当前月份数据
                        _this.initData(selectYear, selectMonth);
                      }
                    } else {
                      wx.showToast({
                        title: res.result.msg || '删除失败',
                        icon: 'none',
                        duration: 2000
                      });
                    }
                  },
                  fail: (err) => {
                    console.error('删除账单失败:', err);
                    wx.hideLoading();
                    wx.showToast({
                      title: '删除失败，请重试',
                      icon: 'none',
                      duration: 2000
                    });
                  }
                });
              }
            }
          });
        }
      }
    });
  },
  // 跳转到记账页
  goAddBook: function() {
    wx.navigateTo({
      url: '/pages/addBook/addBook'
    });
  },
  initData(year, month) { // 初始化
    const _this = this;
    const m = month - 0;
    const monthStr = (m < 10 ? '0' + m : '' + m);
    const dateStr = year + '-' + monthStr + '-01';
    
    console.log('初始化数据，年份:', year, '月份:', month);
    
    // 设置加载状态
    wx.showLoading({
      title: '加载中...',
      mask: true
    });

    // 调用云函数获取账单列表
    wx.cloud.callFunction({
      name: 'getBookList',
      data: {
        year: year,
        month: m
      },
      success: res => {
        console.log('云函数调用成功:', res);
        if (res.result && res.result.code === 0) {
          const result = res.result.data || {};
          const list = result.list || [];
          
          console.log('获取到账单数据:', list);
          
          // 格式化数据
          const formattedList = list.map(item => ({
            ...item,
            id: item._id || '',
            bookTypeIcon: item.bookTypeIcon || 'default',
            bookTypeName: item.bookTypeName || item.category || '未分类',
            remark: item.remark || '',
            amount: parseFloat(item.amount || 0),
            type: item.type || (item.amtType == 1 ? 'income' : 'expense'),
            bookAmt: parseFloat(item.amount || 0).toFixed(2),
            amtType: item.amtType || (item.type === 'income' ? 1 : 0),
            // 确保日期格式正确
            bookDate: item.bookDate || new Date().toISOString().split('T')[0]
          }));
          
          console.log('格式化后的数据:', formattedList);
          
          // 按日期分组
          const groupedData = _this.groupByDate(formattedList);
          
          // 计算总收入支出（以防云函数返回的统计有误）
          let income = 0;
          let pay = 0;
          
          formattedList.forEach(item => {
            if (item.type === 'income') {
              income += parseFloat(item.amount || 0);
            } else {
              pay += parseFloat(item.amount || 0);
            }
          });
          
          // 保存到全局数据
          app.setData('bookList', formattedList);
          
          _this.setData({
            bookList: groupedData,
            incomeAmt: income.toFixed(2),
            payAmt: pay.toFixed(2),
            selectYear: year,
            selectMonth: m,
            date: dateStr,
            allMode: false
          }, () => {
            console.log('更新后的页面数据:', _this.data);
            wx.hideLoading();
            
            wx.showToast({
              title: `加载完成，共${list.length}条记录`,
              icon: 'success',
              duration: 1500
            });
          });
        } else {
          const errorMsg = (res.result && res.result.msg) || '获取账单列表失败';
          console.error('获取账单列表失败:', errorMsg, res);
          wx.hideLoading();
          wx.showToast({
            title: errorMsg,
            icon: 'none',
            duration: 2000
          });
        }
      },
      fail: err => {
        console.error('调用云函数失败:', err);
        wx.hideLoading();
        wx.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  // 按月份分组方法
  groupByDate(data) {
    console.log('开始按月份分组数据:', data);
    const monthGroups = {};
    
    // 确保数据是数组
    if (!Array.isArray(data)) {
      console.error('groupByDate: 数据不是数组', data);
      return [];
    }
    
    data.forEach(item => {
      try {
        // 获取年月信息
        let year, month;
        
        if (item.bookYear && item.bookMonth) {
          // 如果账单有直接的年月字段
          year = item.bookYear;
          month = item.bookMonth;
        } else if (item.bookDate) {
          // 从日期字符串中提取年月
          const dateParts = item.bookDate.split('-');
          year = parseInt(dateParts[0]);
          month = parseInt(dateParts[1]);
        } else if (item.createTime) {
          // 从创建时间中提取年月
          const date = new Date(item.createTime);
          year = date.getFullYear();
          month = date.getMonth() + 1;
        } else {
          // 如果没有日期信息，使用当前日期
          const now = new Date();
          year = now.getFullYear();
          month = now.getMonth() + 1;
        }
        
        // 创建月份键，格式：YYYY-MM
        const monthKey = `${year}-${String(month).padStart(2, '0')}`;
        
        // 初始化月份组
        if (!monthGroups[monthKey]) {
          monthGroups[monthKey] = {
            date: `${year}年${month}月`,
            fullDate: monthKey, // 用于排序
            year: year,
            month: month,
            incomeAmt: 0,
            payAmt: 0,
            list: []
          };
        }
        
        // 累加收入或支出
        const amount = parseFloat(item.amount || 0);
        if (item.type === 'income' || item.amtType === 1) {
          monthGroups[monthKey].incomeAmt += amount;
        } else {
          monthGroups[monthKey].payAmt += amount;
        }
        
        monthGroups[monthKey].list.push(item);
      } catch (err) {
        console.error('处理账单项时出错:', err, item);
      }
    });
    
    // 将分组数据转换为数组并按年月倒序排序
    const result = Object.values(monthGroups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    console.log('分组后的数据:', result);
    return result;
  },
  
  // 保留原有的 sortBookList 方法，但不再使用
  sortBookList(data) {
    console.warn('sortBookList 方法已弃用，请使用 groupByDate 方法');
    return { sortData: [], incomeAmt: 0, payAmt: 0 };
  },
  
  // 选择日期
  selectDate(e) {
    console.log("selectDate:", e);
    let value = e.detail.value;
    value = value.split('-');
    this.initData(value[0], value[1]);
  },
  showAll(){ // 显示全部账单
    const allList = app.getData('bookList') || [];
    
    if (allList.length === 0) {
      wx.showToast({
        title: '没有可显示的账单数据',
        icon: 'none',
        duration: 2000
      });
      return;
    }
    
    // 按年/月倒序排序
    const sortedRaw = [...allList].sort((a,b)=>{
      if (a.bookYear !== b.bookYear) return b.bookYear - a.bookYear;
      if (a.bookMonth !== b.bookMonth) return b.bookMonth - a.bookMonth;
      return 0;
    });
    
    // 按月份分组
    const monthGroups = {};
    let incomeAmt = 0;
    let payAmt = 0;
    
    sortedRaw.forEach(item => {
      const monthKey = `${item.bookYear}-${String(item.bookMonth).padStart(2, '0')}`;
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = {
          date: `${item.bookYear}年${item.bookMonth}月`,
          fullDate: monthKey,
          year: item.bookYear,
          month: item.bookMonth,
          incomeAmt: 0,
          payAmt: 0,
          list: []
        };
      }
      
      // 更新收入和支出
      const amount = parseFloat(item.amount || item.bookAmt || 0);
      if (item.type === 'income' || item.amtType === 1) {
        monthGroups[monthKey].incomeAmt += amount;
        incomeAmt += amount;
      } else {
        monthGroups[monthKey].payAmt += amount;
        payAmt += amount;
      }
      
      monthGroups[monthKey].list.push(item);
    });
    
    // 转换为数组并按年月倒序排序
    const result = Object.values(monthGroups).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });
    
    this.setData({
      bookList: result,
      incomeAmt: parseFloat(incomeAmt.toFixed(2)),
      payAmt: parseFloat(payAmt.toFixed(2)),
      selectYear: '全部',
      selectMonth: '全部',
      date: '',
      allMode: true
    });
  }
})
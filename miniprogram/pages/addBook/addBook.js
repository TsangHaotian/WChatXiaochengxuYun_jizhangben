let app = getApp();
Page({
  data: {
    activeTab:'0',//0支出，1收入
    activeType:'-1',
    bookId:'',
    bookTypeId:'',
    bookTypeList:[],//类型列表
    remark:'',//备注
    amt:'0.00',
    today:'',//今天日期
    selectDay:'',//选择的日期
    editFlag:false,//未修改
    remarkArr:{},//备注列表
    selectTypeRemarks:[],//选中类型的remark列表
  },
  onLoad: function (options) {
    this.initDate();
    if(options.id){
      this.setData({
        bookId:options.id,
        activeTab:options.tab
      });
    }
    this.getRemarkArr();
  },
  onShow: function () {
    if(this.data.bookId){
      this.getBookDetail(this.data.bookId);
    }
    this.initData();
  },
  initData() {
    // 获取类型列表
    let _this = this;
    
    // 显示加载中
    wx.showLoading({
      title: '加载中...',
      mask: true
    });
    
    // 设置一个超时，确保即使云函数调用失败也会隐藏 loading
    const loadingTimer = setTimeout(() => {
      wx.hideLoading();
    }, 10000); // 10秒后自动隐藏
    
    // 调用云函数
    app.getAjax({
      url: 'getBookType',
      params: {
        type: _this.data.activeTab
      },
      success(res) {
        console.log("getBookType 返回:", res);
        
        // 清除超时
        clearTimeout(loadingTimer);
        
        // 确保隐藏加载中
        wx.hideLoading();
        
        if (res && Array.isArray(res.data)) {
          _this.setData({
            bookTypeList: res.data
          });
          
          if (_this.data.bookId && _this.data.bookTypeId) {
            _this.setData({
              activeType: _this.getActiveType(_this.data.bookTypeId)
            });
          }
        } else {
          console.error('获取账单类型失败:', res);
          wx.showToast({
            title: '获取账单类型失败',
            icon: 'none'
          });
        }
      },
      fail(err) {
        console.error('获取账单类型失败:', err);
        // 清除超时
        clearTimeout(loadingTimer);
        
        // 确保隐藏加载中
        wx.hideLoading();
        
        wx.showToast({
          title: '获取账单类型失败',
          icon: 'none'
        });
      },
      complete() {
        // 确保在 complete 中也清除定时器
        clearTimeout(loadingTimer);
      }
    });
  },
  getBookDetail(id){//获取账单记录详情
    let bookList = app.getData('bookList');
    let book = bookList.find(item => item.id === id);
    if(book){
      let setDatas = {
        activeTab: book.amtType,
        amt: book.bookAmt+'',
        selectDay: book.bookYear + '-' + book.bookMonth + '-' + book.bookDate,
        remark: book.remark,
        bookTypeId:book.bookTypeId
      };
      if(this.data.bookTypeList.length){
        setDatas.activeType = this.getActiveType(book.bookTypeId)
      }
      setDatas.selectTypeRemarks = this.getRemarkByType(book.bookTypeId);
      this.setData(setDatas);
    }
  },
  initDate(){//初始化日期
    let date = new Date();
    let dateArr = [
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate()
    ];
    let dateStr = dateArr.join('-');
    this.setData({
      today:dateStr,
      selectDay:dateStr
    });
  },
  selectBookType(e,idx){//选中类型
    let type = idx!=undefined?idx:e.currentTarget.dataset.idx;
    let remarkArr = [];
      let data = this.data;
    if(type == data.activeType){
      type = -1;
    }else{
      remarkArr = this.getRemarkByType(data.bookTypeList[type].id);
    }
    this.setData({
      activeType:type,
      selectTypeRemarks:remarkArr
    });
  },
  getRemarkByType(id) {//根据类型id获取相应备注
    let remarkArr = this.data.remarkArr;
    return remarkArr[id] ? remarkArr[id]:[];
  },
  setRemarkByTip(e){//选中提示的备注
    this.setData({
      remark: e.currentTarget.dataset.remark
    });
  },
  getActiveType(id){//获取选中类型的索引
    let list = this.data.bookTypeList;
    for(var key in list){
      if(list[key].id  == id){
        return key;
      }
    }
    return -1;
  },
  changeTab(e){//切换tab
    let type = e.currentTarget.dataset.type;
    if (type != this.data.activeTab){
      this.setData({
        activeTab:type,
        activeType:-1
      });
      this.initData();
    }
  },
  getRemarkArr(){//获取缓存的remark
    var remarkArr = wx.getStorageSync('remarks');
    if(!remarkArr){
      remarkArr = '{}';
    }
    this.setData({
      remarkArr: typeof remarkArr === 'object' ? remarkArr : JSON.parse(remarkArr)
    });
    console.log("getRemarkArr:", this.data.remarkArr)
  },
  saveBook() {
    // 保存
    let _this = this;
    let data = this.data;
    
    // 验证表单
    if (data.activeType == -1) {
      wx.showToast({
        title: '请选择账单类型',
        icon: 'none'
      });
      return;
    }
    
    if (!data.amt || data.amt == '0.00') {
      wx.showToast({
        title: '请输入金额',
        icon: 'none'
      });
      return;
    }
    
    // 显示加载中
    wx.showLoading({
      title: '保存中...',
      mask: true
    });
    
    // 获取日期信息
    let date = new Date(this.data.selectDay);
    // 如果日期无效，使用当前日期
    if (isNaN(date.getTime())) {
      date = new Date();
    }
    
    // 获取年月日
    const bookYear = date.getFullYear();
    const bookMonth = date.getMonth() + 1; // 月份从0开始，需要加1
    const bookDate = date.getDate();
    const week = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    
    let bookType = data.bookTypeList[data.activeType];
    
    // 准备参数
    let params = {
      amtType: data.activeTab,
      bookAmt: parseFloat(data.amt) || 0,
      bookDate: bookDate,
      bookMonth: bookMonth,
      bookYear: bookYear,
      week: week,
      remark: data.remark || '',
      bookTypeName: bookType.name || '未分类',
      bookTypeIcon: bookType.icon || 'icon_01',
      bookTypeId: bookType.id
    };
    
    console.log('保存参数:', params);
    
    // 保存备注到本地缓存
    if (data.remark) {
      let remarkArr = this.data.remarkArr;
      if (remarkArr[bookType.id]) {
        if (remarkArr[bookType.id].indexOf(data.remark) == -1) {
          remarkArr[bookType.id].push(data.remark);
          this.setData({
            remarkArr: remarkArr
          });
          _this.setStorage('remarks', remarkArr);
        }
      } else {
        remarkArr[bookType.id] = [data.remark];
        this.setData({
          remarkArr: remarkArr
        });
        _this.setStorage('remarks', remarkArr);
      }
    }
    
    // 调用云函数保存数据
    app.getAjax({
      url: 'addBook',
      params: params,
      success(res) {
        console.log('保存成功:', res);
        wx.hideLoading();
        
        // 显示成功提示
        wx.showToast({
          title: '保存成功',
          icon: 'success',
          duration: 1500
        });
        
        // 返回上一页
        setTimeout(() => {
          wx.navigateBack();
        }, 1500);
      },
      fail(err) {
        console.error('保存失败:', err);
        wx.hideLoading();
        
        // 显示错误提示
        wx.showToast({
          title: '保存失败，请重试',
          icon: 'none',
          duration: 2000
        });
      }
    });
  },
  setStorage(name,value){
    wx.setStorage({
      key: name,
      data: JSON.stringify(value)
    });
  },
  setRemark(e){//设置备注
    this.setData({
      remark:e.detail.value
    });
  },
  bindDateChange(e){//选择日期
    this.setData({
      selectDay:e.detail.value
    });
  },
  setAmt(e){//输入金额
    let val = e.currentTarget.dataset.val;
    switch(val){
      case '.':
        this.setDott();
        break;
      default:
        let amt = this.data.amt;
        let setDatas={};
        if(this.data.bookId && this.data.editFlag == false){
          amt = 0;
          setDatas.editFlag = true;
        }
        if(amt == 0){
          amt = '';
        }
        let amtArr = amt.split('.');
        if (amtArr.length == 2) {
          if (amtArr[1].length < 2){
            amt+=val;
          }
        }else{
          amt += val;
        }
        setDatas.amt = amt;
        this.setData(setDatas);
        break;
    }
  },
  delAmt(){//删除
    let amt = this.data.amt;
    amt = amt.substring(0,amt.length-1);
    if(amt == ''){
      amt = '0';
    }
    this.setData({
      amt:amt
    });
  },
  setDott(){//输入.
    let amt = this.data.amt;
    let setDatas={};
    if(this.data.bookId && this.data.editFlag==false){
      amt = '0.00';
      setDatas.editFlag = true;
    }
    if(amt == '0.00'){
      amt = '0.';
    }
    if(amt.indexOf('.')!=-1){
      return;
    }else{
      amt += '.';
    }
    setDatas.amt = amt;
    this.setData(setDatas);
  },
  setRemark(e){//输入备注
    this.setData({
      remark:e.detail.value
    });
  }
})
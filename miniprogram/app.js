// app.js
App({
  onLaunch: function () {
    // 云开发环境初始化
    this.globalData = {
      env: 'xxxxxxxx', // 替换成自己的环境ID
      userInfo: null
    };

    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力');
    } else {
      wx.cloud.init({
        env: this.globalData.env,
        traceUser: true,
      });
    }

    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo;
              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res);
              }
            }
          });
        }
      }
    });
  },

  // 全局方法：显示加载提示
  showLoading: function(title = '加载中...') {
    wx.showLoading({
      title: title,
      mask: true
    });
  },

  // 全局方法：隐藏加载提示
  hideLoading: function() {
    wx.hideLoading();
  },

  // 全局方法：显示提示
  showToast: function(title, icon = 'none', duration = 1500) {
    wx.showToast({
      title: title,
      icon: icon,
      duration: duration
    });
  },

  // 全局方法：显示确认对话框
  showModal: function(content, success, title = '提示') {
    wx.showModal({
      title: title,
      content: content,
      success: function(res) {
        if (res.confirm && typeof success === 'function') {
          success();
        }
      }
    });
  },

  // 全局数据存储
  globalData: {},

  // 设置全局数据
  setData(key, value) {
    this.globalData[key] = value;
  },

  // 获取全局数据
  getData(key) {
    return this.globalData[key];
  },

  // 全局方法：获取当前日期信息
  getDateInfo: function() {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return {
      year,
      month: month < 10 ? '0' + month : month,
      day: day < 10 ? '0' + day : day,
      date: `${year}-${month < 10 ? '0' + month : month}`
    };
  },

  // 全局方法：页面跳转
  navigate: function(url) {
    wx.navigateTo({
      url: url
    });
  },

  // 全局方法：封装请求
  getAjax: function(options) {
    const { url, params = {}, method = 'GET', success, fail, complete } = options;
    
    // 显示加载中
    this.showLoading();
    
    console.log('调用云函数:', url);
    console.log('调用参数:', params);
    
    // 调用云函数
    wx.cloud.callFunction({
      name: url,  // 直接使用 url 作为云函数名
      data: params,  // 直接传递参数
      success: res => {
        console.log('云函数调用成功:', res);
        // 确保隐藏加载中
        this.hideLoading();
        
        // 检查返回结果
        if (res.result && res.result.code === 0) {
          success && success(res.result);
        } else {
          const errMsg = res.result ? (res.result.msg || '请求失败') : '请求失败';
          console.error('云函数返回错误:', errMsg);
          this.showToast(errMsg);
          fail && fail(res);
        }
      },
      fail: err => {
        console.error('云函数调用失败:', err);
        this.hideLoading();
        
        let errMsg = '网络请求失败';
        if (err.errMsg) {
          if (err.errMsg.includes('FunctionName parameter could not be found')) {
            errMsg = '云函数未找到，请检查云函数名称是否正确并重新部署';
          } else if (err.errMsg.includes('ENOENT')) {
            errMsg = '云函数不存在，请检查云函数名称和部署状态';
          } else {
            errMsg = err.errMsg;
          }
        }
        this.showToast(errMsg);
        fail && fail(err);
      },
      complete: () => {
        this.hideLoading();
        complete && complete();
      }
    });
  }
});

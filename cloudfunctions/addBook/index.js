// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { 
      amtType,      // 0-支出, 1-收入
      bookAmt,      // 金额
      bookDate,     // 日期 (日)
      bookMonth,    // 月份
      bookYear,     // 年份
      week,         // 星期
      remark,       // 备注
      bookTypeName, // 类型名称
      bookTypeIcon, // 类型图标
      bookTypeId    // 类型ID
    } = event

    // 验证必填字段
    if (amtType === undefined || !bookAmt || !bookTypeId) {
      return {
        code: 400,
        msg: '缺少必填参数',
        data: null
      }
    }

    // 解析日期
    let dateObj;
    if (bookDate && bookMonth && bookYear) {
      // 如果传入了完整的日期信息，使用传入的日期
      dateObj = new Date(bookYear, bookMonth - 1, bookDate);
    } else if (bookDate) {
      // 如果只传入了日期，假设是当前年月
      const now = new Date();
      dateObj = new Date(now.getFullYear(), now.getMonth(), bookDate);
    } else {
      // 如果没有传入日期，使用当前日期
      dateObj = new Date();
    }
    
    // 确保日期有效
    if (isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }
    
    // 构建账单数据
    const bookData = {
      _openid: wxContext.OPENID,
      type: amtType == 0 ? 'expense' : 'income',
      amount: parseFloat(bookAmt),
      bookDate: bookDate || dateObj.getDate(),
      bookMonth: bookMonth || (dateObj.getMonth() + 1),
      bookYear: bookYear || dateObj.getFullYear(),
      week: week || ['日', '一', '二', '三', '四', '五', '六'][dateObj.getDay()],
      remark: remark || '',
      bookTypeName: bookTypeName || '未分类',
      bookTypeIcon: bookTypeIcon || 'icon_01',
      bookTypeId: bookTypeId,
      createTime: db.serverDate(),
      updateTime: db.serverDate()
    }

    // 插入数据到数据库
    const result = await db.collection('books').add({
      data: bookData
    })

    return {
      code: 0,
      msg: '添加成功',
      data: {
        _id: result._id,
        ...bookData
      }
    }
  } catch (err) {
    console.error('添加账单失败:', err)
    return {
      code: -1,
      msg: '添加失败: ' + err.message,
      data: null
    }
  }
}

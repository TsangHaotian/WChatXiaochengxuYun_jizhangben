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
    const { year, month } = event

    // 验证参数
    if (!year || !month) {
      return {
        code: 400,
        msg: '缺少必要参数',
        data: null
      }
    }

    // 构造查询条件
    const where = {
      _openid: wxContext.OPENID,
      bookYear: parseInt(year),
      bookMonth: parseInt(month)
    }

    // 查询数据
    const { data } = await db
      .collection('books')
      .where(where)
      .orderBy('bookDate', 'desc')
      .orderBy('createTime', 'desc')
      .get()

    // 计算总收入和总支出
    let income = 0
    let pay = 0

    data.forEach(item => {
      if (item.type === 'income') {
        income += parseFloat(item.amount || 0)
      } else {
        pay += parseFloat(item.amount || 0)
      }
    })

    return {
      code: 0,
      msg: 'success',
      data: {
        list: data,
        income: income.toFixed(2),
        pay: pay.toFixed(2)
      }
    }
  } catch (err) {
    console.error('获取账单列表失败:', err)
    return {
      code: -1,
      msg: '获取账单列表失败: ' + err.message,
      data: null
    }
  }
}

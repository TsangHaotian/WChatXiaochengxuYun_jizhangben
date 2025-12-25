// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const wxContext = cloud.getWXContext()
    const { id } = event

    // 验证参数
    if (!id) {
      return {
        code: 400,
        msg: '缺少账单ID参数',
        data: null
      }
    }

    // 查询要删除的账单，确保只能删除自己的账单
    const queryResult = await db.collection('books').doc(id).get()
    if (!queryResult.data) {
      return {
        code: 404,
        msg: '未找到对应的账单记录',
        data: null
      }
    }

    // 验证当前用户是否有权限删除该账单
    if (queryResult.data._openid !== wxContext.OPENID) {
      return {
        code: 403,
        msg: '没有权限删除该账单',
        data: null
      }
    }

    // 删除账单
    const result = await db.collection('books').doc(id).remove()

    if (result.stats.removed === 1) {
      return {
        code: 0,
        msg: '删除成功',
        data: {
          _id: id
        }
      }
    } else {
      return {
        code: 500,
        msg: '删除失败，请重试',
        data: null
      }
    }
  } catch (err) {
    console.error('删除账单失败:', err)
    return {
      code: -1,
      msg: '删除失败: ' + (err.message || '服务器错误'),
      data: null
    }
  }
}

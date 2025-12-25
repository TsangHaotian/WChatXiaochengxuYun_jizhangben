// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 账单类型配置
const BOOK_TYPES = {
  // 支出类型
  '0': [
    { id: 'gamme', name: '游戏', icon: 'icon_01' },
    { id: 'movie', name: '电影', icon: 'icon_02' },
    { id: 'sport', name: '运动', icon: 'icon_04' },
    { id: 'play', name: '娱乐', icon: 'icon_08' },
    { id: 'food', name: '餐饮', icon: 'icon_14' },
    { id: 'other', name: '其他', icon: 'icon_06' },
  ],
  // 收入类型
  '1': [
    { id: 'salary', name: '工资', icon: 'icon_115' },
    { id: 'bonus', name: '奖金', icon: 'icon_118' },
    { id: 'investment', name: '投资', icon: 'icon_116' },
    { id: 'other_income', name: '其他收入', icon: 'icon_119' },
  ]
}

// 云函数入口函数
exports.main = async (event, context) => {
  try {
    const { type = '0' } = event // 默认获取支出类型
    
    // 返回对应的账单类型
    return {
      code: 0,
      msg: 'success',
      data: BOOK_TYPES[type] || []
    }
  } catch (err) {
    console.error('获取账单类型失败:', err)
    return {
      code: -1,
      msg: '获取账单类型失败: ' + err.message,
      data: []
    }
  }
}

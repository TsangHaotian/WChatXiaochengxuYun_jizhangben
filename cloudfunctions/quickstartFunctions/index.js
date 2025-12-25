const cloud = require("wx-server-sdk");
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();

// 获取用户账单列表
const getUserBookList = async (event) => {
  try {
    const { bookYear, bookMonth, allMode } = event;
    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    // 构建查询条件
    const query = { 
      _openid: openid,
      bookYear: bookYear || 2025,  // 添加默认值
      bookMonth: bookMonth || 12    // 添加默认值
    };
    
    // 查询账单列表
    const result = await db.collection('books')
      .where(query)
      .orderBy('bookDate', 'desc')
      .orderBy('createTime', 'desc')
      .get();
    
    // 计算总收入/支出
    let income = 0;
    let pay = 0;
    
    result.data.forEach(item => {
      const amount = parseFloat(item.amount) || 0;
      if (item.type === 'income') {
        income += amount;
      } else {
        pay += amount;
      }
    });
    
    return {
      code: 0,
      msg: 'success',
      data: {
        list: result.data || [],
        income: income.toFixed(2),
        pay: pay.toFixed(2)
      }
    };
  } catch (err) {
    console.error('获取账单列表失败', err);
    return {
      code: -1,
      msg: '获取账单列表失败: ' + err.message,
      data: null
    };
  }
};

// 删除账单
const deleteBook = async (event) => {
  try {
    const { id } = event;
    if (!id) {
      return {
        code: 400,
        msg: '缺少必要参数: id',
        data: null
      };
    }

    const wxContext = cloud.getWXContext();
    const openid = wxContext.OPENID;
    
    // 验证账单是否存在且属于当前用户
    const book = await db.collection('books').doc(id).get();
    if (!book.data || book.data._openid !== openid) {
      return {
        code: 404,
        msg: '账单不存在或没有权限删除',
        data: null
      };
    }
    
    // 删除账单
    await db.collection('books').doc(id).remove();
    
    return {
      code: 0,
      msg: '删除成功',
      data: null
    };
  } catch (err) {
    console.error('删除账单失败', err);
    return {
      code: -1,
      msg: '删除账单失败: ' + err.message,
      data: null
    };
  }
};

// 云函数入口函数
exports.main = async (event, context) => {
  console.log('收到云函数调用请求:', JSON.stringify(event, null, 2));
  
  // 如果是测试调用，返回一个简单的响应
  if (!event.type) {
    return {
      code: 0,
      msg: '云函数运行正常',
      data: {
        event: event,
        env: cloud.DYNAMIC_CURRENT_ENV,
        timestamp: new Date().toISOString()
      }
    };
  }

  try {
    const { type, ...params } = event;
    
    switch (type) {
      case "getUserBookList":
        return await getUserBookList(params);
      case "deleteBook":
        return await deleteBook(params);
      default:
        return {
          code: 400,
          msg: `不支持的操作类型: ${type}`,
          data: null
        };
    }
  } catch (err) {
    console.error('云函数执行错误:', err);
    return {
      code: -1,
      msg: '服务器错误: ' + (err.message || '未知错误'),
      data: null
    };
  }
};

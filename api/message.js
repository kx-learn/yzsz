/**
 * 本地消息管理工具函数
 * 所有消息都保存在本地存储中
 */

/**
 * 获取消息列表（从本地存储）
 * @param {Object} params 查询参数
 * @param {String} params.type 消息类型：system-系统，order-订单，team-团队，reward-奖励
 * @param {Number} params.page 页码
 * @param {Number} params.pageSize 每页数量
 */
export const getMessageList = (params = {}) => {
  try {
    const allMessages = uni.getStorageSync('messageList') || []
    
    // 如果指定了类型，进行筛选
    let filteredMessages = allMessages
    if (params.type) {
      filteredMessages = allMessages.filter(msg => msg.type === params.type)
    }
    
    // 分页处理
    const page = params.page || 1
    const pageSize = params.pageSize || 50
    const start = (page - 1) * pageSize
    const end = start + pageSize
    
    const paginatedMessages = filteredMessages.slice(start, end)
    
    return Promise.resolve({
      data: {
        list: paginatedMessages,
        total: filteredMessages.length,
        page: page,
        pageSize: pageSize
      }
    })
  } catch (error) {
    console.error('获取消息列表失败', error)
    return Promise.resolve({
      data: {
        list: [],
        total: 0,
        page: 1,
        pageSize: 50
      }
    })
  }
}

/**
 * 获取未读消息数量（从本地存储）
 */
export const getUnreadCount = () => {
  try {
    const allMessages = uni.getStorageSync('messageList') || []
    const unreadCount = allMessages.filter(msg => !msg.read).length
    
    // 保存到本地存储
    uni.setStorageSync('unreadMessageCount', unreadCount)
    
    return Promise.resolve({
      data: {
        count: unreadCount
      }
    })
  } catch (error) {
    console.error('获取未读消息数失败', error)
    return Promise.resolve({
      data: {
        count: 0
      }
    })
  }
}

/**
 * 标记消息为已读（本地存储）
 * @param {Number|String} messageId 消息ID
 */
export const markAsRead = (messageId) => {
  try {
    const allMessages = uni.getStorageSync('messageList') || []
    const messageIndex = allMessages.findIndex(msg => msg.id == messageId)
    
    if (messageIndex > -1) {
      allMessages[messageIndex].read = true
      uni.setStorageSync('messageList', allMessages)
      
      // 更新未读数量
      const unreadCount = allMessages.filter(msg => !msg.read).length
      uni.setStorageSync('unreadMessageCount', unreadCount)
      
      console.log('消息已标记为已读', messageId)
    }
    
    return Promise.resolve({ success: true })
  } catch (error) {
    console.error('标记消息已读失败', error)
    return Promise.reject(error)
  }
}

/**
 * 标记所有消息为已读（本地存储）
 */
export const markAllAsRead = () => {
  try {
    const allMessages = uni.getStorageSync('messageList') || []
    allMessages.forEach(msg => {
      msg.read = true
    })
    
    uni.setStorageSync('messageList', allMessages)
    uni.setStorageSync('unreadMessageCount', 0)
    
    console.log('所有消息已标记为已读')
    return Promise.resolve({ success: true })
  } catch (error) {
    console.error('标记所有消息已读失败', error)
    return Promise.reject(error)
  }
}

/**
 * 删除消息（本地存储）
 * @param {Number|String} messageId 消息ID
 */
export const deleteMessage = (messageId) => {
  try {
    const allMessages = uni.getStorageSync('messageList') || []
    const filteredMessages = allMessages.filter(msg => msg.id != messageId)
    
    uni.setStorageSync('messageList', filteredMessages)
    
    // 更新未读数量
    const unreadCount = filteredMessages.filter(msg => !msg.read).length
    uni.setStorageSync('unreadMessageCount', unreadCount)
    
    console.log('消息已删除', messageId)
    return Promise.resolve({ success: true })
  } catch (error) {
    console.error('删除消息失败', error)
    return Promise.reject(error)
  }
}

/**
 * 获取消息详情（从本地存储）
 * @param {Number|String} messageId 消息ID
 */
export const getMessageDetail = (messageId) => {
  try {
    const allMessages = uni.getStorageSync('messageList') || []
    const message = allMessages.find(msg => msg.id == messageId)
    
    if (message) {
      return Promise.resolve({
        data: message
      })
    } else {
      return Promise.reject(new Error('消息不存在'))
    }
  } catch (error) {
    console.error('获取消息详情失败', error)
    return Promise.reject(error)
  }
}

/**
 * 添加本地消息
 * @param {Object} messageData 消息数据
 * @param {String} messageData.type 消息类型：system-系统，order-订单，team-团队，reward-奖励
 * @param {String} messageData.title 消息标题
 * @param {String} messageData.content 消息内容
 * @param {Number} messageData.orderId 订单ID（可选）
 * @param {String} messageData.orderNo 订单号（可选）
 * @param {Number} messageData.amount 金额（可选）
 */
export const addLocalMessage = (messageData) => {
  try {
    const allMessages = uni.getStorageSync('messageList') || []
    
    const newMessage = {
      id: Date.now() + Math.random(), // 确保唯一ID
      type: messageData.type || 'system',
      title: messageData.title || '通知',
      content: messageData.content || '',
      time: formatTime(new Date()),
      created_at: new Date().toISOString(),
      read: false,
      orderId: messageData.orderId || null,
      orderNo: messageData.orderNo || null,
      amount: messageData.amount || null
    }
    
    // 添加到消息列表开头
    allMessages.unshift(newMessage)
    
    // 保存到本地存储
    uni.setStorageSync('messageList', allMessages)
    
    // 更新未读数量
    const unreadCount = allMessages.filter(msg => !msg.read).length
    uni.setStorageSync('unreadMessageCount', unreadCount)
    
    console.log('本地消息已添加', newMessage)
    return newMessage
  } catch (error) {
    console.error('添加本地消息失败', error)
    return null
  }
}

/**
 * 格式化时间
 */
const formatTime = (date) => {
  if (!date) return ''
  
  const now = new Date()
  const time = new Date(date)
  const diff = now - time
  
  // 1分钟内
  if (diff < 60000) {
    return '刚刚'
  }
  // 1小时内
  if (diff < 3600000) {
    return Math.floor(diff / 60000) + '分钟前'
  }
  // 今天
  if (now.toDateString() === time.toDateString()) {
    return time.getHours() + ':' + String(time.getMinutes()).padStart(2, '0')
  }
  // 昨天
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (yesterday.toDateString() === time.toDateString()) {
    return '昨天'
  }
  // 一周内
  if (diff < 7 * 24 * 3600000) {
    return Math.floor(diff / (24 * 3600000)) + '天前'
  }
  // 更早
  return time.getMonth() + 1 + '-' + time.getDate()
}

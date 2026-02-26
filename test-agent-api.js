/**
 * 测试 Agent API
 */

const API_KEY = 'agent-a-collector-kwjdiedhd';
const BASE_URL = 'http://localhost:3000'; // Next.js 默认端口

async function testAgent() {
  console.log('🧪 开始测试 Agent API...\n');
  
  try {
    // 测试 1: 列出所有 Agent
    console.log('📋 测试 1: 列出所有 Agent');
    const agentsResponse = await fetch(`${BASE_URL}/api/agents`);
    const agents = await agentsResponse.json();
    console.log('✅ Agents:', JSON.stringify(agents, null, 2));
    console.log('');
    
    // 测试 2: 发送消息
    console.log('💬 测试 2: 发送消息给小采');
    const chatResponse = await fetch(`${BASE_URL}/api/agent/chat`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: '你好，小采！今天天气怎么样？'
      })
    });
    
    const result = await chatResponse.json();
    console.log('✅ Response:', JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('\n✨ 测试成功！小采回复了:', result.data.reply);
    } else {
      console.log('\n❌ 测试失败:', result.error?.message);
    }
    
  } catch (error) {
    console.error('❌ 测试出错:', error.message);
  }
}

// 运行测试
testAgent();

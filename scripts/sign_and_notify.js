// sign_and_notify.js
// 在受控的后端/开发服务器上运行：node sign_and_notify.js
// 请将 /path/to/merchant_key.pem 替换为你自己的私钥路径（仅后端使用）
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const privateKey = fs.readFileSync('/path/to/merchant_key.pem', 'utf8');
const body = JSON.stringify({
  resource: {
    event_type: 'TRANSACTION.SUCCESS',
    out_trade_no: 'TEST123456',
    transaction_id: 'WX_TX_98765',
    amount: { total: 100 }
  }
});
const timestamp = Math.floor(Date.now() / 1000).toString();
const nonce = crypto.randomBytes(16).toString('hex');
const message = `${timestamp}\n${nonce}\n${body}\n`;

const sign = crypto.createSign('RSA-SHA256');
sign.update(message);
sign.end();
const signature = sign.sign(privateKey, 'base64');

const options = {
  hostname: 'hzai.tech',
  path: '/wechat-pay/notify',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Wechatpay-Signature': signature,
    'Wechatpay-Timestamp': timestamp,
    'Wechatpay-Nonce': nonce,
    'Wechatpay-Serial': 'TEST_SERIAL'
  }
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(res.statusCode, data));
});
req.on('error', e => console.error(e));
req.write(body);
req.end();

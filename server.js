const express = require('express');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const app = express();
const PORT = process.env.PORT || 3000;

// Your existing screenshot function (imported/run as child process)
const runScreenshot = () => {
  return new Promise((resolve, reject) => {
    exec('node screenshot.js', (error, stdout, stderr) => {
      if (error) {
        reject({ error: error.message, stderr });
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
};

// API endpoint to trigger screenshot
app.post('/screenshot', async (req, res) => {
  console.log('📸 Screenshot triggered via API');
  
  try {
    const result = await runScreenshot();
    console.log('✅ Screenshot completed');
    res.json({
      success: true,
      message: 'Screenshot completed',
      output: result.stdout.split('\n').slice(-5) // Last 5 lines of output
    });
  } catch (error) {
    console.error('❌ Screenshot failed:', error);
    res.status(500).json({
      success: false,
      error: error.error || error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Screenshot service listening on port ${PORT}`);
  console.log(`   POST /screenshot - Trigger screenshot`);
  console.log(`   GET  /health   - Health check`);
});

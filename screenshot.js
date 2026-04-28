const puppeteer = require('puppeteer');
const https = require('https');
const http = require('http');

// Configuration
const RANDOM_POST_API = 'https://uk49s.online/screenshot_tool/get_random_testimonial.php';
const SCREENSHOT_API = 'https://uk49s.online/screenshot_tool/get_testimonial.php';
const VIEWPORT = { width: 360, height: 663 };

// Helper function to fetch random post ID and full data
async function getRandomTestimonial() {
    return new Promise((resolve, reject) => {
        const url = new URL(RANDOM_POST_API);
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'GET',
            headers: {
                'User-Agent': 'Node.js Screenshot Bot'
            }
        };
        
        const protocol = url.protocol === 'https:' ? https : http;
        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`📡 Random Post API Response: ${res.statusCode}`);
                try {
                    const response = JSON.parse(data);
                    if (response.status === 'success') {
                        console.log(`✅ Random post selected: ID ${response.post_id}`);
                        console.log(`   Username: ${response.username}`);
                        if (response.content_preview) {
                            console.log(`   Content: ${response.content_preview}`);
                        }
                        console.log(`   URL: ${response.url}`);
                        resolve(response);
                    } else {
                        reject(new Error(response.message));
                    }
                } catch (e) {
                    reject(new Error(`Failed to parse response: ${e.message}`));
                }
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

// Helper function to send screenshot and testimonial data to API
async function sendToAPI(filename, screenshotBuffer, testimonialData) {
    return new Promise((resolve, reject) => {
        const base64Data = screenshotBuffer.toString('base64');
        const postData = JSON.stringify({
            // Screenshot data
            screenshot: base64Data,
            filename: filename,
            screenshot_taken_at: new Date().toISOString(),
            
            // Testimonial post data (from get_random_testimonial.php)
            post_id: testimonialData.post_id,
            username: testimonialData.username,
            content: testimonialData.content || '',
            created_at: testimonialData.created_at,
            post_url: testimonialData.url,
            total_testimonials: testimonialData.total_testimonials,
            randomly_selected_from: testimonialData.randomly_selected_from
        });
        
        const url = new URL(SCREENSHOT_API);
        const options = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const protocol = url.protocol === 'https:' ? https : http;
        const req = protocol.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`📡 Screenshot API Response: ${res.statusCode}`);
                try {
                    const response = JSON.parse(data);
                    resolve(response);
                } catch (e) {
                    resolve({ status: 'unknown', data: data });
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

async function takeScreenshot() {
    console.log('🚀 Starting screenshot job...');
    console.log('='.repeat(50));
    
    // Step 1: Get random testimonial data (includes post_id, username, content, etc.)
    console.log('\n📋 STEP 1: Getting random testimonial post...');
    let testimonialData;
    try {
        testimonialData = await getRandomTestimonial();
    } catch (error) {
        console.error(`❌ Failed to get testimonial: ${error.message}`);
        process.exit(1);
    }
    
    // Step 2: Launch browser
    console.log('\n🌐 STEP 2: Launching browser...');
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // Set mobile viewport
        await page.setViewport({
            width: VIEWPORT.width,
            height: VIEWPORT.height,
            deviceScaleFactor: 1,
            isMobile: true,
            hasTouch: true
        });
        
        // Set iPhone user agent
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1');
        
        // Navigate to the specific testimonial page
        const url = `https://uk49s.online/comments.php?post_id=${testimonialData.post_id}`;
        console.log(`\n🌐 STEP 3: Navigating to: ${url}`);
        
        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });
        
        // Wait for content to load
        console.log(`⏳ Waiting for page to load...`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Take screenshot
        const now = new Date();
        const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
        const filename = `testimonial_${testimonialData.post_id}_${timestamp}.png`;
        
        console.log(`\n📸 STEP 4: Taking screenshot...`);
        const screenshotBuffer = await page.screenshot({ fullPage: false });
        
        console.log(`✅ Screenshot taken: ${filename}`);
        console.log(`📊 Size: ${(screenshotBuffer.length / 1024).toFixed(2)} KB`);
        
        // Step 5: Send to API with ALL testimonial data
        console.log(`\n📤 STEP 5: Sending screenshot and testimonial data to API...`);
        console.log(`   Post ID: ${testimonialData.post_id}`);
        console.log(`   Username: ${testimonialData.username}`);
        
        const response = await sendToAPI(filename, screenshotBuffer, testimonialData);
        
        if (response.status === 'success') {
            console.log(`\n✨ SUCCESS!`);
            console.log(`   📸 Screenshot saved: ${response.screenshot.file}`);
            console.log(`   📄 JSON saved: ${response.json.file}`);
            console.log(`   🗑️ Deleted ${response.deleted_previous.screenshots} previous screenshot(s)`);
            console.log(`   🗑️ Deleted ${response.deleted_previous.json_files} previous JSON file(s)`);
            console.log(`   🆔 Post ID: ${response.testimonial.post_id}`);
            console.log(`   👤 Username: ${response.testimonial.username}`);
        } else {
            console.log(`\n⚠️ Warning: ${response.message}`);
        }
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 Job completed successfully!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    } finally {
        await browser.close();
    }
}

// Run the job
takeScreenshot();
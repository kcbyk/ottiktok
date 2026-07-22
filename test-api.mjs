async function runFullTest() {
  console.log("Starting new test...");
  const url = "https://www.youtube.com/watch?v=jNQXAC9IVRw";
  const res = await fetch("https://solebz.onrender.com/api/v1/download", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": "solebz_benimsifrem_123" },
    body: JSON.stringify({ url: url, mode: "video" }),
  });
  const initData = await res.json();
  const jobId = initData.job_id;
  console.log("Job ID:", jobId);
  
  while(true) {
    const statusRes = await fetch(`https://solebz.onrender.com/api/v1/status/${jobId}`, {
      headers: { "x-api-key": "solebz_benimsifrem_123" }
    });
    const data = await statusRes.json();
    console.log(`Status: ${data.status}, Progress: ${data.progress}`);
    
    if (data.status === "completed") {
      console.log("Completed! Downloading file from:", data.url);
      const https = require('https');
      const fs = require('fs');
      
      const file = fs.createWriteStream("test_video.mp4");
      https.get(data.url, function(response) {
        console.log("File Response Status:", response.statusCode);
        console.log("Headers:", response.headers);
        
        response.pipe(file);
        
        // Also grab the first few bytes to check magic string
        let firstBytes = null;
        response.on('data', chunk => {
            if (!firstBytes) {
                firstBytes = chunk;
                const hex = chunk.slice(0, 16).toString('hex');
                const ascii = chunk.slice(0, 16).toString('ascii').replace(/[^ -~]/g, '.');
                console.log("MAGIC BYTES (HEX):", hex);
                console.log("MAGIC BYTES (ASCII):", ascii);
            }
        });
        
        file.on('finish', function() {
          file.close(() => {
            console.log("Download complete. File saved.");
            process.exit(0);
          });
        });
      });
      break;
    }
    
    if (data.status === "error" || data.status === "failed") {
        console.error("Job Failed:", data);
        process.exit(1);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
}
runFullTest();

async function runFullTest() {
  try {
    const url = "https://www.youtube.com/watch?v=jNQXAC9IVRw"; // short video
    const res = await fetch("https://solebz.onrender.com/api/v1/download", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": "solebz_benimsifrem_123" },
      body: JSON.stringify({ url: url, mode: "video" }),
    });
    const initData = await res.json();
    
    if (!initData.job_id) return;
    
    const jobId = initData.job_id;
    while(true) {
      const statusRes = await fetch(`https://solebz.onrender.com/api/v1/status/${jobId}`, {
        headers: { "x-api-key": "solebz_benimsifrem_123" }
      });
      const data = await statusRes.json();
      
      if (data.status === "completed" || data.status === "error") {
        console.log("FINAL DATA:", JSON.stringify(data, null, 2));
        break;
      }
      
      await new Promise(r => setTimeout(r, 2000));
    }

    // Now test other endpoints
    console.log("Testing endpoints after completion:");
    const endpoints = [
      `/api/v1/download/${jobId}`,
      `/api/v1/jobs/${jobId}`,
      `/api/v1/result/${jobId}`
    ];
    
    for (const ep of endpoints) {
      console.log("Testing GET " + ep);
      const epRes = await fetch(`https://solebz.onrender.com${ep}`, {
        headers: { "x-api-key": "solebz_benimsifrem_123" }
      });
      console.log("STATUS:", epRes.status);
      console.log("BODY:", await epRes.text());
    }

  } catch(e) {
    console.error(e);
  }
}

runFullTest();

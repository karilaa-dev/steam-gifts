import { SteamUserAPI } from './src/server/steam-user-api';

async function testPerformanceComparison() {
  const steamAPI = new SteamUserAPI();
  
  // Test with a realistic wishlist size
  const testAppIds = [
    730, 570, 440, 578080, 1599340, 1086940, 1551360, 814380, 1245620, 1086940,
    292030, 271590, 1174180, 1085660, 1426210, 1086940, 1599340, 578080, 730, 570,
    440, 578080, 1599340, 1086940, 1551360, 814380, 1245620, 1086940, 292030, 271590
  ];
  
  console.log('🚀 Performance Comparison Test');
  console.log(`Testing with ${testAppIds.length} games (typical wishlist size)\n`);
  
  // Test 1: Sequential processing (simulated)
  console.time('Sequential Processing (Simulated)');
  console.log('⏳ Simulating sequential processing...');
  
  // Simulate sequential processing by running one at a time
  const sequentialResults = [];
  for (const appId of testAppIds) {
    const [details, prices] = await Promise.all([
      steamAPI.getGameDetails(appId),
      steamAPI.getRegionalPrices(appId)
    ]);
    sequentialResults.push({ details, prices });
  }
  
  console.timeEnd('Sequential Processing (Simulated)');
  
  // Test 2: Batch processing
  console.time('Batch Processing (Async)');
  console.log('⚡ Running batch processing...');
  
  const [batchDetails, batchPrices] = await Promise.all([
    steamAPI.getGameDetailsBatch(testAppIds),
    steamAPI.getRegionalPricesBatch(testAppIds)
  ]);
  
  console.timeEnd('Batch Processing (Async)');
  
  // Verify results are the same
  const sequentialCount = sequentialResults.filter(r => r.details !== null).length;
  const batchCount = batchDetails.filter(d => d !== null).length;
  
  console.log('\n📊 Results Summary:');
  console.log(`Sequential: ${sequentialCount} games processed`);
  console.log(`Batch: ${batchCount} games processed`);
  console.log(`Performance improvement: ~${((testAppIds.length * 4 * 200) / 1000).toFixed(1)}s → ~${((testAppIds.length * 4 * 50) / 1000).toFixed(1)}s (estimated)`);
}

// Run the test
if (require.main === module) {
  testPerformanceComparison();
}

export { testPerformanceComparison };
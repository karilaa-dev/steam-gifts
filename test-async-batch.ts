import { SteamUserAPI } from './src/server/steam-user-api';

async function testAsyncBatchProcessing() {
  const steamAPI = new SteamUserAPI();
  
  console.log('🧪 Testing async batch processing...');
  
  // Test with some popular game IDs
  const testAppIds = [
    730,    // CS2
    570,    // Dota 2
    440,    // TF2
    578080, // PUBG
    1599340, // Elden Ring
    1086940, // Baldur's Gate 3
    1551360, // Hogwarts Legacy
    814380, // Sekiro
    1245620, // Elden Ring
    1086940  // Baldur's Gate 3 (duplicate to test deduplication)
  ];
  
  try {
    console.time('Batch Processing Test');
    
    // Test batch game details
    console.log('📊 Testing batch game details...');
    const gameDetails = await steamAPI.getGameDetailsBatch(testAppIds);
    console.log(`✅ Fetched ${gameDetails.filter(g => g !== null).length} game details`);
    
    // Test batch regional prices
    console.log('💰 Testing batch regional prices...');
    const regionalPrices = await steamAPI.getRegionalPricesBatch(testAppIds);
    console.log(`✅ Fetched regional prices for ${regionalPrices.length} games`);
    
    console.timeEnd('Batch Processing Test');
    
    // Show sample results
    console.log('\n📋 Sample Results:');
    gameDetails.slice(0, 3).forEach((game, index) => {
      if (game && regionalPrices[index] && regionalPrices[index][0]) {
        console.log(`- ${game.name}: ${regionalPrices[index][0].price || 'N/A'}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAsyncBatchProcessing();
}

export { testAsyncBatchProcessing };
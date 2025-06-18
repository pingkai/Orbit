// Test script to verify the history tracking fixes
// This can be run in the React Native debugger console

const testHistoryFixes = async () => {
  console.log('🧪 Testing History Manager Fixes...');
  
  // Mock song data
  const testSong = {
    id: 'test-song-123',
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 180000, // 3 minutes
    url: 'test://song.mp3'
  };

  try {
    // Test 1: Play song for 1 minute, then play again for 3 minutes
    console.log('\n📝 Test 1: Cumulative Time Tracking');
    
    // First play session - 1 minute
    console.log('▶️ Starting first play session (1 minute)...');
    await historyManager.startTracking(testSong);
    
    // Simulate 1 minute of listening
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for demo
    historyManager.lastSavedDuration = 60000; // Simulate 1 minute listened
    await historyManager.saveProgress(true);
    await historyManager.stopTracking();
    
    // Check history after first session
    const historyAfterFirst = await historyManager.getHistory();
    const firstEntry = historyAfterFirst.find(item => item.id === testSong.id);
    console.log(`✅ After 1st session: Listen time = ${firstEntry?.listenDuration}ms, Play count = ${firstEntry?.playCount}`);
    
    // Second play session - 3 minutes (should add to existing time)
    console.log('▶️ Starting second play session (3 minutes)...');
    await new Promise(resolve => setTimeout(resolve, 100)); // Small delay
    await historyManager.startTracking(testSong);
    
    // Simulate 3 minutes of listening
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second for demo
    historyManager.lastSavedDuration = 180000; // Simulate 3 minutes listened
    await historyManager.saveProgress(true);
    await historyManager.stopTracking();
    
    // Check final history
    const historyAfterSecond = await historyManager.getHistory();
    const finalEntry = historyAfterSecond.find(item => item.id === testSong.id);
    console.log(`✅ After 2nd session: Listen time = ${finalEntry?.listenDuration}ms, Play count = ${finalEntry?.playCount}`);
    
    // Verify results
    const expectedTime = 60000 + 180000; // 1min + 3min = 4min
    const actualTime = finalEntry?.listenDuration || 0;
    const playCount = finalEntry?.playCount || 0;
    
    console.log('\n📊 Test Results:');
    console.log(`Expected total time: ${expectedTime}ms (4 minutes)`);
    console.log(`Actual total time: ${actualTime}ms`);
    console.log(`Play count: ${playCount} (should be 2)`);
    
    if (actualTime >= expectedTime * 0.9 && playCount === 2) { // Allow 10% tolerance
      console.log('✅ PASS: Cumulative time tracking works correctly!');
    } else {
      console.log('❌ FAIL: Cumulative time tracking not working properly');
    }
    
    // Test 2: Verify no double counting on quick replays
    console.log('\n📝 Test 2: No Double Counting on Quick Replays');
    
    const initialPlayCount = finalEntry?.playCount || 0;
    
    // Start tracking same song again quickly (within 5 minutes)
    await historyManager.startTracking(testSong);
    await new Promise(resolve => setTimeout(resolve, 500));
    await historyManager.stopTracking();
    
    const historyAfterQuickReplay = await historyManager.getHistory();
    const quickReplayEntry = historyAfterQuickReplay.find(item => item.id === testSong.id);
    const newPlayCount = quickReplayEntry?.playCount || 0;
    
    console.log(`Play count before quick replay: ${initialPlayCount}`);
    console.log(`Play count after quick replay: ${newPlayCount}`);
    
    if (newPlayCount === initialPlayCount) {
      console.log('✅ PASS: No double counting on quick replays!');
    } else {
      console.log('❌ FAIL: Double counting detected on quick replays');
    }
    
    console.log('\n🎉 History Manager Fix Tests Complete!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Export for use in React Native debugger
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testHistoryFixes };
}

// Auto-run if in browser console
if (typeof window !== 'undefined') {
  console.log('Run testHistoryFixes() to test the fixes');
}

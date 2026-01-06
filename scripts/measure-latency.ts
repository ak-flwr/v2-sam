import { performance } from 'perf_hooks';

const API_URL = 'http://localhost:3000/api/chat';

async function measureLatency() {
  const testMessage = 'السلام عليكم';
  const shipmentId = 'SHP-2025-001';

  console.log('🔬 SAM v2 Latency Diagnostics\n');
  console.log('='.repeat(50));

  // Test 1: Simple greeting (no tool use)
  console.log('\n📊 Test 1: Simple Greeting (no action)');
  const t1Start = performance.now();

  const res1 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: testMessage, shipment_id: shipmentId })
  });

  const t1Data = performance.now();
  const data1 = await res1.json();
  const t1End = performance.now();

  console.log(`  TTFB (time to first byte): ${(t1Data - t1Start).toFixed(0)}ms`);
  console.log(`  Total response time: ${(t1End - t1Start).toFixed(0)}ms`);
  console.log(`  Response length: ${data1.text?.length || 0} chars`);
  console.log(`  Has audio: ${!!data1.audioUrl}`);

  // Test 2: Action request (tool use)
  console.log('\n📊 Test 2: Action Request (update instructions)');
  const t2Start = performance.now();

  const res2 = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'غير تعليمات التوصيل إلى اتصل قبل الوصول',
      shipment_id: shipmentId
    })
  });

  const t2Data = performance.now();
  const data2 = await res2.json();
  const t2End = performance.now();

  console.log(`  TTFB: ${(t2Data - t2Start).toFixed(0)}ms`);
  console.log(`  Total response time: ${(t2End - t2Start).toFixed(0)}ms`);
  console.log(`  Action executed: ${data2.actionExecuted || false}`);
  console.log(`  Has audio: ${!!data2.audioUrl}`);

  // Test 3: Audio generation isolated
  console.log('\n📊 Test 3: TTS Latency Estimate');
  const audioSize = data1.audioUrl ? Math.round(data1.audioUrl.length * 0.75 / 1024) : 0;
  console.log(`  Audio payload size: ~${audioSize}KB`);

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📈 SUMMARY');
  console.log('='.repeat(50));
  console.log(`  Simple query: ${(t1End - t1Start).toFixed(0)}ms`);
  console.log(`  Action query: ${(t2End - t2Start).toFixed(0)}ms`);
  console.log('\n🎯 Targets for phone-like experience:');
  console.log('  - Simple query: <1000ms');
  console.log('  - Action query: <1500ms');
  console.log('  - TTS start: <500ms after text');
}

measureLatency().catch(console.error);

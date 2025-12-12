/**
 * Concurrency Test Script
 * Tests the booking system's ability to handle multiple simultaneous bookings
 * and prevent overbooking
 */

const http = require('http');

const BASE_URL = 'http://localhost:4000/api';

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            data: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            data: body
          });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

async function runConcurrencyTest() {
  console.log('🧪 Starting Concurrency Test...\n');

  try {
    // Step 1: Create a doctor
    console.log('📋 Step 1: Creating doctor...');
    const doctorRes = await makeRequest('POST', '/admin/doctors', {
      name: 'Dr. Test Specialist',
      specialization: 'Concurrency Testing'
    });

    if (doctorRes.status !== 201) {
      throw new Error(`Failed to create doctor: ${JSON.stringify(doctorRes.data)}`);
    }

    const doctorId = doctorRes.data.id;
    console.log(`✅ Doctor created: ${doctorId}\n`);

    // Step 2: Create a slot with limited capacity
    console.log('📋 Step 2: Creating slot with capacity=3...');
    const slotRes = await makeRequest('POST', `/admin/doctors/${doctorId}/slots`, {
      start_time: new Date(Date.now() + 3600000).toISOString(),
      end_time: new Date(Date.now() + 7200000).toISOString(),
      capacity: 3
    });

    if (slotRes.status !== 201) {
      throw new Error(`Failed to create slot: ${JSON.stringify(slotRes.data)}`);
    }

    const slotId = slotRes.data.id;
    console.log(`✅ Slot created: ${slotId} with capacity 3\n`);

    // Step 3: Attempt 10 concurrent bookings
    console.log('🚀 Step 3: Attempting 10 concurrent bookings (capacity is only 3)...\n');

    const bookingRequests = [];
    for (let i = 1; i <= 10; i++) {
      const request = makeRequest('POST', `/slots/${slotId}/book`, {
        patient_name: `Patient ${i}`,
        patient_contact: `patient${i}@example.com`
      });
      bookingRequests.push(request);
    }

    const bookingResults = await Promise.all(bookingRequests);

    // Analyze results
    let successCount = 0;
    let failureCount = 0;
    const successBookings = [];
    const failureReasons = {};

    bookingResults.forEach((result, index) => {
      if (result.status === 201) {
        successCount++;
        successBookings.push(result.data.id);
        console.log(`  ✅ Patient ${index + 1}: BOOKED (ID: ${result.data.id})`);
      } else {
        failureCount++;
        const errorMsg = result.data.error || 'Unknown error';
        failureReasons[errorMsg] = (failureReasons[errorMsg] || 0) + 1;
        console.log(`  ❌ Patient ${index + 1}: FAILED (${result.status} - ${errorMsg})`);
      }
    });

    console.log('\n📊 Results:\n');
    console.log(`   Total Attempts: 10`);
    console.log(`   ✅ Successful Bookings: ${successCount}`);
    console.log(`   ❌ Failed Bookings: ${failureCount}`);
    console.log(`   Capacity: 3`);

    console.log('\n📈 Analysis:');
    if (successCount <= 3) {
      console.log(
        `   ✅ PASS: System correctly limited bookings to capacity (${successCount} <= 3)`
      );
    } else {
      console.log(
        `   ❌ FAIL: Overbooking occurred! (${successCount} bookings > capacity of 3)`
      );
    }

    console.log('\n🔍 Error Breakdown:');
    Object.entries(failureReasons).forEach(([reason, count]) => {
      console.log(`   ${count}x "${reason}"`);
    });

    // Step 4: Confirm a booking and verify capacity check
    if (successBookings.length > 0) {
      console.log(`\n📋 Step 4: Confirming one booking (${successBookings[0]})...\n`);

      const confirmRes = await makeRequest('POST', `/bookings/${successBookings[0]}/confirm`);
      if (confirmRes.status === 200) {
        console.log(`✅ Booking confirmed: ${confirmRes.data.status}`);
      } else {
        console.log(`❌ Confirmation failed: ${JSON.stringify(confirmRes.data)}`);
      }
    }

    console.log('\n✨ Test completed successfully!\n');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
runConcurrencyTest();

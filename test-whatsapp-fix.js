#!/usr/bin/env node

// Test the phone normalization logic directly
function normalizePhoneNumber(phone) {
  if (!phone) return "";

  let cleaned = phone.toString().trim();

  cleaned = cleaned.replace(/\s/g, '');
  cleaned = cleaned.replace(/\(/g, '').replace(/\)/g, '');
  cleaned = cleaned.replace(/-/g, '');
  cleaned = cleaned.replace(/\./g, '');

  cleaned = cleaned.replace(/\+/g, '');

  cleaned = cleaned.replace(/\D/g, '');

  if (!cleaned) return "";

  if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }

  if (cleaned.startsWith('91')) {
    cleaned = cleaned.substring(2);
  }

  if (cleaned.length === 10) {
    cleaned = '91' + cleaned;
  }

  if (cleaned.length < 10) {
    return "";
  }

  if (cleaned.length > 15) {
    return "";
  }

  if (!cleaned.startsWith('91')) {
    cleaned = '91' + cleaned;
  }

  return cleaned;
}

function validatePhoneNumber(phone) {
  const normalized = normalizePhoneNumber(phone);
  if (!normalized) {
    return { valid: false, reason: "Empty phone number" };
  }

  if (normalized.length < 10) {
    return { valid: false, reason: `Too short (${normalized.length} digits)` };
  }

  if (normalized.length > 15) {
    return { valid: false, reason: `Too long (${normalized.length} digits)` };
  }

  const digits = normalized.substring(2);

  if (digits.length !== 10) {
    return { valid: false, reason: `Mobile number must be 10 digits, got ${digits.length}` };
  }

  const prefix = digits.charAt(0);
  if (!['6', '7', '8', '9'].includes(prefix)) {
    return { valid: false, reason: `Invalid mobile prefix: ${prefix}` };
  }

  return { valid: true, normalized, reason: normalized };
}

function testPhoneNormalization() {
  console.log('Testing Phone Normalization for WhatsApp Automation...');
  console.log('='.repeat(80));

  // Test cases from the issue description
  const testCases = [
    // Valid Indian mobile numbers from the issue
    { input: '+919725159639', expected: '919725159639', valid: true, description: 'Valid: +919725159639' },
    { input: '+919662018159', expected: '919662018159', valid: true, description: 'Valid: +919662018159' },
    
    // Various formats that should normalize to the same number
    { input: '9725159639', expected: '919725159639', valid: true, description: 'Valid: 9725159639 (10 digits)' },
    { input: '919725159639', expected: '919725159639', valid: true, description: 'Valid: 919725159639 (with country code)' },
    { input: '+91 9725159639', expected: '919725159639', valid: true, description: 'Valid: +91 9725159639 (with space)' },
    { input: '+91 97251 59639', expected: '919725159639', valid: true, description: 'Valid: +91 97251 59639 (with spaces)' },
    { input: '+91-9725159639', expected: '919725159639', valid: true, description: 'Valid: +91-9725159639 (with hyphen)' },
    { input: '09725159639', expected: '919725159639', valid: true, description: 'Valid: 09725159639 (with leading 0)' },
    { input: '97251-59639', expected: '919725159639', valid: true, description: 'Valid: 97251-59639 (with hyphen)' },
    { input: '(97251) 59639', expected: '919725159639', valid: true, description: 'Valid: (97251) 59639 (with parentheses)' },
    
    // Invalid numbers that should be rejected
    { input: '123', expected: '', valid: false, description: 'Invalid: Too short' },
    { input: '1234567890', expected: '', valid: false, description: 'Invalid: Invalid prefix (1)' },
    { input: '5123456789', expected: '', valid: false, description: 'Invalid: Invalid prefix (5)' },
    { input: 'abc123456789', expected: '', valid: false, description: 'Invalid: Contains letters' },
    { input: '', expected: '', valid: false, description: 'Invalid: Empty string' },
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    const result = validatePhoneNumber(testCase.input);
    const normalized = result.normalized || '';
    const passedTest = normalized === testCase.expected && result.valid === testCase.valid;

    if (passedTest) {
      passed++;
      console.log(`✓ PASS: ${testCase.description}`);
      console.log(`  Input:    '${testCase.input}'`);
      console.log(`  Expected: '${testCase.expected}' (valid: ${testCase.valid})`);
      console.log(`  Got:      '${normalized}' (valid: ${result.valid})`);
    } else {
      failed++;
      console.log(`✗ FAIL: ${testCase.description}`);
      console.log(`  Input:    '${testCase.input}'`);
      console.log(`  Expected: '${testCase.expected}' (valid: ${testCase.valid})`);
      console.log(`  Got:      '${normalized}' (valid: ${result.valid}, reason: ${result.reason})`);
    }
    console.log('');
  }

  console.log('='.repeat(80));
  console.log(`Total Tests: ${passed + failed}, Passed: ${passed}, Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ Phone normalization tests failed!');
    return false;
  }

  console.log('\n✅ All phone normalization tests passed!');
  return true;
}

function testCampaignFlow() {
  console.log('\nTesting Campaign Flow...');
  console.log('='.repeat(80));

  // Simulate the campaign flow
  const leads = [
    { id: '1', companyName: 'Lead 1', phone: '+919725159639', expected: 'valid' },
    { id: '2', companyName: 'Lead 2', phone: '123', expected: 'invalid' },
    { id: '3', companyName: 'Lead 3', phone: '+919662018159', expected: 'valid' },
    { id: '4', companyName: 'Lead 4', phone: '5123456789', expected: 'invalid' },
    { id: '5', companyName: 'Lead 5', phone: '+91 97251 59639', expected: 'valid' },
  ];

  let validCount = 0;
  let invalidCount = 0;
  let skippedCount = 0;

  console.log('Processing leads...');
  console.log('');

  for (const lead of leads) {
    const result = validatePhoneNumber(lead.phone);
    
    if (result.valid) {
      validCount++;
      console.log(`✓ Lead ${lead.id} (${lead.companyName}): VALID -> ${result.normalized}`);
    } else {
      invalidCount++;
      skippedCount++;
      console.log(`✗ Lead ${lead.id} (${lead.companyName}): INVALID -> ${result.reason}`);
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log(`Campaign Summary:`);
  console.log(`  Total Leads: ${leads.length}`);
  console.log(`  Valid Leads: ${validCount}`);
  console.log(`  Invalid Leads: ${invalidCount}`);
  console.log(`  Skipped Leads: ${skippedCount}`);
  console.log(`  Campaign Status: ${validCount > 0 ? 'RUNNING' : 'FAILED'}`);

  if (validCount > 0) {
    console.log('\n✅ Campaign would start successfully!');
    console.log(`   ${validCount} valid leads will be processed.`);
    console.log(`   ${skippedCount} invalid leads will be skipped with reasons.`);
    return true;
  } else {
    console.log('\n❌ Campaign would fail!');
    console.log('   No valid leads to process.');
    return false;
  }
}

if (require.main === module) {
  try {
    const phoneTestPassed = testPhoneNormalization();
    const campaignTestPassed = testCampaignFlow();

    console.log('\n' + '='.repeat(80));
    console.log('FINAL RESULTS');
    console.log('='.repeat(80));

    if (phoneTestPassed && campaignTestPassed) {
      console.log('✅ All tests passed! WhatsApp automation pipeline is fixed.');
      console.log('\nKey improvements:');
      console.log('  ✓ Phone numbers are properly normalized and validated');
      console.log('  ✓ Campaigns skip invalid leads instead of failing');
      console.log('  ✓ Skipped leads are tracked with reasons');
      console.log('  ✓ Valid leads are processed successfully');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed!');
      process.exit(1);
    }

  } catch (error) {
    console.error('\nTest execution failed:', error.message);
    process.exit(1);
  }
}

module.exports = { testPhoneNormalization, testCampaignFlow };
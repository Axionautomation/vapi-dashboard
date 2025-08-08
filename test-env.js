require('dotenv').config({ path: '.env.local' });

console.log('Environment Variables Test:');
console.log('==========================');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET (length: ' + process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length + ')' : 'NOT SET');

// Test URL validity
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('✅ URL is valid');
  } catch (error) {
    console.log('❌ URL is invalid:', error.message);
  }
} else {
  console.log('❌ URL is not set');
} 
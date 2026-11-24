const fs = require('fs');
const content = fs.readFileSync('dist/assets/index-B7T_3jkr.js', 'utf8');

const hasRealKey = content.includes('AIzaSy');
const hasDemoKey = content.includes('AIzaSyDemoPlaceholder');
console.log('Real Firebase key in bundle:', hasRealKey ? 'YES' : 'NO');
console.log('Demo placeholder key:', hasDemoKey ? 'YES - PROBLEM!' : 'no');

const pos = content.indexOf('isFirebaseConfigured');
console.log('\nisFirebaseConfigured context:');
console.log(content.substring(pos, pos + 300));

// Check what firebase project is being used
const projPos = content.indexOf('women-s-favorite');
const projPos2 = content.indexOf('womens-favorite-demo');
console.log('\nProject ID "women-s-favorite" found:', projPos !== -1 ? 'YES' : 'NO');
console.log('Project ID "womens-favorite-demo" found:', projPos2 !== -1 ? 'YES' : 'NO');

// Find the actual firebase config values
const authDomPos = content.indexOf('.firebaseapp.com');
if (authDomPos !== -1) {
  console.log('\nFirebase auth domain area:', content.substring(authDomPos - 80, authDomPos + 40));
}

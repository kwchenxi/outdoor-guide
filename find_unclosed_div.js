const fs = require('fs');
const path = require('path');

// Read the file content
const filePath = path.join(__dirname, 'components/TrailGuideView.tsx');
const content = fs.readFileSync(filePath, 'utf8');

// Split into lines
const lines = content.split('\n');
let depth = 0;

console.log('Tracking div tag depth...');
console.log('====================================');

lines.forEach((line, index) => {
    const lineNumber = index + 1;
    
    // Count opening div tags
    const openingDivs = (line.match(/<div/g) || []).length;
    
    // Count closing div tags
    const closingDivs = (line.match(/<\/div/g) || []).length;
    
    // Update depth
    depth += openingDivs;
    
    // Check if depth becomes negative
    if (depth < 0) {
        console.log(`ERROR: Line ${lineNumber} has too many closing div tags (depth: ${depth})`);
        console.log(`Line content: ${line.trim()}`);
        console.log('====================================');
    }
    
    // Update depth after checking
    depth -= closingDivs;
    
    // Log if this line contains div tags
    if (openingDivs > 0 || closingDivs > 0) {
        console.log(`Line ${lineNumber}: div+${openingDivs} / div-${closingDivs} (depth: ${depth + closingDivs} -> ${depth})`);
        console.log(`Line content: ${line.trim()}`);
        console.log('====================================');
    }
});

console.log(`\nFinal depth: ${depth}`);
if (depth > 0) {
    console.log(`ERROR: Found ${depth} unclosed div tags!`);
} else if (depth < 0) {
    console.log(`ERROR: Found ${Math.abs(depth)} extra closing div tags!`);
} else {
    console.log('SUCCESS: All div tags are properly closed!');
}
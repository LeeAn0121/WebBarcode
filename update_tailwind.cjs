const fs = require('fs');
let tw = fs.readFileSync('tailwind.config.js', 'utf8');

tw = tw.replace('keyframes: {', `keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },`);

if(!tw.includes('float:')) {
    console.log("Failed to insert float keyframe");
} else {
    fs.writeFileSync('tailwind.config.js', tw);
    console.log("Tailwind float keyframe added");
}

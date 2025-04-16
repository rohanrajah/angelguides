export function initializeFonts() {
  // Add Cormorant Garamond and Nunito Sans fonts
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Nunito+Sans:wght@300;400;600;700&display=swap';
  document.head.appendChild(link);
  
  // Add Font Awesome
  const fontAwesome = document.createElement('link');
  fontAwesome.rel = 'stylesheet';
  fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css';
  document.head.appendChild(fontAwesome);
  
  // Add Tailwind styles for the fonts
  const style = document.createElement('style');
  style.textContent = `
    :root {
      --font-heading: 'Cormorant Garamond', serif;
      --font-body: 'Nunito Sans', sans-serif;
    }
    
    .font-heading {
      font-family: var(--font-heading);
    }
    
    .font-body {
      font-family: var(--font-body);
    }

    h1, h2, h3, h4, h5, h6 {
      font-family: var(--font-heading);
    }

    body {
      font-family: var(--font-body);
    }
  `;
  document.head.appendChild(style);
}

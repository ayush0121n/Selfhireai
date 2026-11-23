/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./features/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          warm: "#FEF5E7",
          card: "#FFFFFF",
        },
        text: {
          primary: "#2D0E03",
        },
        border: {
          subtle: "rgba(110, 37, 10, 0.15)",
          rust: "#6E250A",
        },
        accent: {
          primary: "#B34A0E",
          vibrant: "#E67E22",
        },
        surface: {
          peach: "#FAD7A0",
        },
        status: {
          success: "#10B981",
        }
      },
      fontFamily: {
        brand: ["MaisonSalome", "Georgia", "serif"],
        display: ["'Cormorant Garamond'", "Georgia", "serif"],
        sans: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        body: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        editorial: ["'Cormorant Garamond'", "Georgia", "serif"],
      },
      borderRadius: {
        card: "12px",
        button: "12px",
        inner: "12px",
      },
      borderWidth: {
        card: "0.8px",
      },
      boxShadow: {
        subtle: "0px 4px 6px rgba(0, 0, 0, 0.02)",
      },
      lineHeight: {
        body: "1.63",
      },
      letterSpacing: {
        h1: "-1.5px",
      },
      fontSize: {
        h1: ["78px", { lineHeight: "1.05", letterSpacing: "-1.5px", fontWeight: "700" }],
        h2: ["36px", { lineHeight: "1.2", letterSpacing: "-0.5px", fontWeight: "700" }],
        h3: ["18px", { lineHeight: "1.3", letterSpacing: "0px", fontWeight: "500" }],
        body: ["15px", { lineHeight: "1.63", fontWeight: "400" }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
      }
    },
  },
  plugins: [],
}

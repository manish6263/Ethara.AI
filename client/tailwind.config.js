/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#17202a",
        mist: "#f6f7f9",
        line: "#dfe4ea",
        teal: "#0f766e",
        amber: "#b7791f",
        coral: "#c2410c"
      },
      boxShadow: {
        soft: "0 16px 40px rgba(23, 32, 42, 0.08)"
      }
    }
  },
  plugins: []
};

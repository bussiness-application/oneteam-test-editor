/** @type {import('tailwindcss').Config} */
// eslint-disable-next-line no-undef
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    fontFamily: {},
    extend: {
      backgroundImage: {
        "oneteam-illustration":
          "url('../assets/images/login-illustration.svg')",
      },
      colors: {
        // ONE TEAM
        primary: "#D86800",
        secondary: "#FFEEE0",
        gainsboro: "#DBDBDB",
        lotion: "#FAFAFA",
        "anti-flash": "#F2F2F2",
        "sea-green": "#46B274",
        "sonic-silver": "#79747E",
        "deep-carmine-pink": " #F03B3B",
        crayola: "#FF4D4F",
        "ghost-white": "#FCF8FF",
        lavender: "#E7D9F3",
        coral: "#FF7C4A",
        "deep-Peach": "#FFD1A7",
        "pastel-red": "#F56868",
      },
      spacing: {
        4.5: "18px",
      },
      rotate: {
        "-25": "-25deg",
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};

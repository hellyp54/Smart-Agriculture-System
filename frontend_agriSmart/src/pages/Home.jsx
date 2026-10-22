import React from "react";
import NavbarComponent from "../components/NavbarComponent";
import HeroSection from "../components/Hero";
import FeaturesSection from "../components/Features";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      {/* <NavbarComponent /> */}
      <HeroSection />
      <FeaturesSection />
      <Footer />
    </>
  );
}

export default Home;
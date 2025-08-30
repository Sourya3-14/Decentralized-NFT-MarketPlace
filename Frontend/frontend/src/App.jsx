import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig, queryClient } from "./wagmi";
import LandingPage from "./pages/LandingPage";
// import MintNFT from "./components/MintNFT";
// import ListNFT from "./components/ListNFT";
import Marketplace from "./pages/Marketplace";
import MyNFTs from "./pages/MyNFTs";
import "./App.css";

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="App">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/market" element={<Marketplace />} />
              {/* <Route path="/mint" element={<MintNFT />} /> */}
              {/* <Route path="/list" element={<ListNFT />} /> */}
              <Route path="/mynft" element={<MyNFTs />} />
              {/* <Route path="*" element={<Navigate to="/" replace />} /> */}
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;

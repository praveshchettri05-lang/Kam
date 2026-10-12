"use client";

import dynamic from "next/dynamic";
import "@/kam/index.css";

const App = dynamic(() => import("@/kam/App"), { ssr: false });

export default function Home() {
  return <App />;
}

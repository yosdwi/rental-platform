"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Splash } from "@/components/brand/splash";
import { useApp } from "@/lib/store/store";

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    const t = setTimeout(() => {
      const s = useApp.getState().session;
      router.replace(!s ? "/masuk" : s.role === "owner" ? "/mitra" : "/beranda");
    }, 1500);
    return () => clearTimeout(t);
  }, [router]);
  return <Splash />;
}

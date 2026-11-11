"use client";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApp } from "@/lib/store/store";
import { Splash } from "@/components/brand/splash";

export default function StoreLink() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  useEffect(() => {
    const { world, session } = useApp.getState();
    const s = world.stores.find((x) => x.slug === slug || x.id === slug);
    if (!session || session.role !== "renter") router.replace("/masuk");
    else router.replace(s ? `/toko/${s.id}` : "/beranda");
  }, [slug, router]);
  return <Splash />;
}

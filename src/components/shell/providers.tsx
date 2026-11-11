"use client";
import { useEffect } from "react";
import { Toaster } from "sonner";
import { useApp } from "@/lib/store/store";
import { startSync } from "@/lib/store/sync";
import { Splash } from "@/components/brand/splash";
import { ScenarioPanel } from "@/components/sim/scenario-panel";
import { SimRunner, GpsTracker } from "@/components/sim/runners";
import { Notifier } from "@/components/shell/notifier";

export function Providers({ children }: { children: React.ReactNode }) {
  const hydrated = useApp((s) => s.hydrated);
  useEffect(() => {
    useApp.getState().hydrate();
    startSync();
  }, []);
  return (
    <>
      {hydrated ? children : <Splash />}
      <Toaster
        position="top-center"
        offset={14}
        mobileOffset={12}
        toastOptions={{
          classNames: {
            toast: "!rounded-[18px] !border-line !shadow-[0_10px_30px_rgba(20,23,43,0.14)] !font-sans !py-3.5",
            title: "!text-[14px] !font-bold !text-ink",
            description: "!text-[13px] !text-muted",
            actionButton: "!bg-brand !rounded-xl !h-8 !px-3 !font-semibold",
          },
        }}
      />
      {hydrated && (
        <>
          <ScenarioPanel />
          <SimRunner />
          <GpsTracker />
          <Notifier />
        </>
      )}
    </>
  );
}

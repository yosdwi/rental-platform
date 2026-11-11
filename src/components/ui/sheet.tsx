"use client";
import { Drawer } from "vaul";
import { cn } from "@/lib/cn";

export function Sheet({
  open, onOpenChange, title, hideTitle, children, className, snapPoints, modal = true, dismissible = true, activeSnapPoint, setActiveSnapPoint,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  hideTitle?: boolean;
  children: React.ReactNode;
  className?: string;
  snapPoints?: (number | string)[];
  modal?: boolean;
  dismissible?: boolean;
  activeSnapPoint?: number | string | null;
  setActiveSnapPoint?: (s: number | string | null) => void;
}) {
  return (
    <Drawer.Root
      open={open}
      onOpenChange={onOpenChange}
      snapPoints={snapPoints}
      modal={modal}
      dismissible={dismissible}
      activeSnapPoint={activeSnapPoint}
      setActiveSnapPoint={setActiveSnapPoint}
    >
      <Drawer.Portal>
        {modal && <Drawer.Overlay className="fixed inset-0 z-40 bg-[#0b0d1a]/35" />}
        <Drawer.Content
          className={cn(
            "fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[92dvh] w-full max-w-[520px] flex-col rounded-t-[28px] bg-surface outline-none",
            "shadow-[0_-8px_40px_rgba(20,23,43,0.12)]",
            className,
          )}
        >
          <div className="mx-auto mt-2.5 mb-1 h-1.5 w-10 shrink-0 rounded-full bg-line-strong" />
          <Drawer.Title className={cn("px-5 pt-2 pb-1 text-[17px] font-bold tracking-tight", hideTitle && "sr-only")}>
            {title}
          </Drawer.Title>
          <Drawer.Description className="sr-only">{title}</Drawer.Description>
          <div className="hide-scrollbar flex-1 overflow-y-auto px-5 pb-safe">{children}</div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

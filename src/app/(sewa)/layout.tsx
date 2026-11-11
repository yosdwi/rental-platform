import { RenterShell } from "@/components/shell/renter-shell";
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RenterShell>{children}</RenterShell>;
}

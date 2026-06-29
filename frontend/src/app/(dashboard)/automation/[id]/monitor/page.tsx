import MonitorClient from "./MonitorClient";

export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default function Page() {
  return <MonitorClient />;
}

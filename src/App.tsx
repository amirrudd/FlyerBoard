import { Toaster } from "sonner";
import { DivarApp } from "./components/DivarApp";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <DivarApp />
      <Toaster />
    </div>
  );
}

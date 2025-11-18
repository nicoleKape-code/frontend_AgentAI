import { BubbleBackground } from "@/components/ui/BubbleBackground";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
            <BubbleBackground
        interactive={true}
        className="fixed inset-0 z-0"
      />

      {/* Content (doesn't block mouse events) */}
      <div className="relative z-10 pointer-events-none flex items-center justify-center min-h-screen text-white">
        <h1 className="text-4xl font-bold">Your content here</h1>
      </div>

    </main>
  );
}



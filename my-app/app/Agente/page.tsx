"use client";

import { useState } from "react";

import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  PromptInputButton,
} from "@/components/ui/shadcn-io/ai/prompt-input";
import { PaperclipIcon } from 'lucide-react';

import { BubbleBackground } from "@/components/ui/BubbleBackground";

export default function Home() {
  const [input, setInput] = useState("");

  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background */}
      <BubbleBackground
        interactive={true}
        className="fixed inset-0 z-0"
      />

      <div className="relative z-10 flex z-10 pointer-events-none w-full px-4 items-center justify-center min-h-screen text-white">
        <div className="w-full pointer-events-auto px-4 pt-140 max-w-7xl">
          <PromptInput className="w-full h-38" onSubmit={() => {}}>
            <PromptInputTextarea
              value={input}
              onChange={(e) => setInput(e.currentTarget.value)}
              placeholder="What do you want to know..."
            />
            <PromptInputToolbar>
            <PromptInputButton>
            <PaperclipIcon/>
            </PromptInputButton>
              <PromptInputSubmit disabled={!input.trim()} />
            </PromptInputToolbar>
          </PromptInput>
        </div>
      </div>
    </main>
  );
}



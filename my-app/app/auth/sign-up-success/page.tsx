"use client";
import React, { useEffect } from "react";
import { FiArrowRight, FiMail } from "react-icons/fi";
import Image from "next/image";
import {
  useMotionTemplate,
  useMotionValue,
  motion,
  animate,
} from "framer-motion";
import Link from "next/link";

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

export default function Page() {
  const color = useMotionValue(COLORS_TOP[0]);

  useEffect(() => {
    animate(color, COLORS_TOP, {
      ease: "easeInOut",
      duration: 10,
      repeat: Infinity,
      repeatType: "mirror",
    });
  }, [color]);

  const backgroundImage = useMotionTemplate`radial-gradient(125% 125% at 50% 0%, #020617 50%, ${color})`;
  const border = useMotionTemplate`1px solid ${color}`;
  const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;
  const backgroundColor = useMotionTemplate`${color}`;

  return (
    <motion.section
      style={{
        backgroundImage,
      }}
      className="relative grid min-h-screen place-content-center overflow-hidden bg-gray-950 px-4 py-24 text-gray-200"
    >
      <header className="w-full py-4 px-8 flex items-center justify-between fixed top-0 bg-transparent z-50">
        <div className="flex items-center gap-3">
          <Image
            src="/Logo.png"
            alt="GovCheck Logo"
            className="w-12 h-12 object-cover"
            width={48}
            height={48}
          />
          <span className="text-3xl font-bold text-white">GovCheck</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/Login">
            <motion.div
              style={{ border, boxShadow }}
              className="px-4 py-2 rounded-md font-medium bg-black/30 backdrop-blur-sm cursor-pointer hover:bg-black/50 transition text-white"
            >
              Sign In
            </motion.div>
          </Link>
        </div>
      </header>

      <div className="relative z-10 flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="mb-8 p-6 rounded-full bg-green-500/20 border border-green-400/30"
        >
          <FiMail className="w-16 h-16 text-green-400" />
        </motion.div>
        
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="max-w-3xl bg-gradient-to-br from-white to-gray-400 bg-clip-text text-center text-3xl font-medium leading-tight text-transparent sm:text-5xl sm:leading-tight md:text-6xl md:leading-tight"
        >
          Thank you for signing up!
        </motion.h1>
        
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="my-6 max-w-xl text-center text-base leading-relaxed md:text-lg md:leading-relaxed"
        >
          Check your email to confirm your account. We&apos;ve sent you a confirmation link to complete your registration.
        </motion.p>
        
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <Link href="/Login">
            <motion.button
              style={{
                border,
                boxShadow,
              }}
              whileHover={{
                scale: 1.015,
              }}
              whileTap={{
                scale: 0.985,
              }}
              className="group relative flex w-fit items-center gap-1.5 rounded-full bg-gray-950/10 px-6 py-3 text-gray-50 transition-colors hover:bg-gray-950/50"
            >
              Continue to Login
              <FiArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
            </motion.button>
          </Link>
          
          <Link href="/">
            <motion.button
              style={{ backgroundColor, boxShadow }}
              whileHover={{
                scale: 1.015,
              }}
              whileTap={{
                scale: 0.985,
              }}
              className="group relative flex w-fit items-center gap-1.5 rounded-full px-6 py-3 text-white transition-colors"
            >
              Back to Home
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
}

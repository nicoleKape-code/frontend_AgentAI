"use client";
import { ReactLenis } from "lenis/react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  animate,
} from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";


const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];


export const ShuffleHero = () => {


  return (
    <div className="bg-black min-h-screen">
      <ReactLenis
        root
        options={{
          // Learn more -> https://github.com/darkroomengineering/lenis?tab=readme-ov-file#instance-settings
          lerp: 0.05,
          //   infinite: true,
          //   syncTouch: true,
        }}
      >
        <Nav />
        <Login />
      </ReactLenis>
    </div>
  );
};


const Nav = () => {
    const router = useRouter();
  return (
    <nav className=" bg-black fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-3 text-white">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1 text-lg text-zinc-400"
      >
        <FiArrowLeft /> Home 
      </button>
    </nav>
  );
};


const Login = () => {
    const color = useMotionValue(COLORS_TOP[0]);
    useEffect(() => {
        animate(color, COLORS_TOP, {
          ease: "easeInOut",
          duration: 10,
          repeat: Infinity,
          repeatType: "mirror",
        });
      }, [color]);

    const border = useMotionTemplate`1px solid ${color}`;
    const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;
    const backgroundColor = useMotionTemplate`${color}`;
    return (
      <section
        id="signin"
        className="mx-auto max-w-5xl px-4 py-48 pt-1 pb-80 text-white mt-60"
      >
        <motion.h1
          initial={{ y: 48, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ ease: "easeInOut", duration: 0.75 }}
          className="mb-20 text-7xl font-black uppercase text-zinc-50 text-center"
        >
          LOGIN
        </motion.h1>
        <div className ="flex flex-col items-center space-y-6">
        <motion.div
            style={{ border, boxShadow }}
            className="p-[2px] rounded-full w-[450px] mx-auto"
            >
            <input
                type="email"
                placeholder="Email"
                className="w-full rounded-full bg-black/30 text-white px-3 py-2 backdrop-blur-sm 
                        focus:outline-none"
            />
        </motion.div>
        <motion.div
            style={{ border, boxShadow }}
            className="p-[2px] rounded-full w-[450px] mx-auto mt-1"
            >
            <input
                type="password"
                placeholder="Password"
                className="w-full rounded-full bg-black/30 backdrop-blur-sm cursor-pointer hover:bg-black/50 transition text-white px-3 py-2  
                        focus:outline-none"
            />
        </motion.div>
        <Link href="/Agente">
        <motion.div
            style={{ backgroundColor, boxShadow }}
            className="px-4 py-2 w-[450px] h-[45px] rounded-full font-medium text-white
             bg-black/30 backdrop-blur-sm cursor-pointer hover:bg-black/50 transition
             flex items-center justify-center mt-13"
            >
                Submit
        </motion.div>
        </Link>

        </div>
      </section>
    );
  };
  

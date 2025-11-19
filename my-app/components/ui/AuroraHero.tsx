"use client";
// import { Canvas } from "@react-three/fiber"; // Comentado porque no se usa
import React, { useEffect } from "react";
import { FiArrowRight } from "react-icons/fi";
import Image from "next/image";
import {
  useMotionTemplate,
  useMotionValue,
  motion,
  animate,
} from "framer-motion";
import Link from "next/link";

const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];

export const AuroraHero = () => {
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
            {/* LEFT */}
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
              {/* RIGHT */}
              <div className="flex items-center gap-4">
            <Link href="/Signin">
                <motion.div
                style={{ backgroundColor, boxShadow}}
                className="px-4 py-2 rounded-md font-medium bg-black/30 backdrop-blur-sm cursor-pointer hover:bg-black/50 transition text-white"
                >
                    Registrarse
            </motion.div>
            </Link>

            <Link href="/Login">
                <motion.div
                    style={{ border, boxShadow}}
                    className="px-4 py-2 rounded-md font-medium bg-black/30 backdrop-blur-sm cursor-pointer hover:bg-black/50 transition text-white"
                    >
                        Iniciar Sesión
                </motion.div>
            </Link>
            </div>
        </header>

        <div className="relative z-10 flex flex-col items-center">
            <h1 className="max-w-3xl bg-linear-to-br from-white to-gray-400 bg-clip-text text-center text-3xl font-medium leading-tight text-transparent sm:text-5xl sm:leading-tight md:text-7xl md:leading-tight">
            Multi-Agent para tus trámites
            </h1>
            <p className="my-6 max-w-xl text-center text-base leading-relaxed md:text-lg md:leading-relaxed">
            Consulta trámites oficiales fácilmente, de forma segura y desde un solo lugar. Ahorra tiempo y evita filas con nuestro sistema automatizado.
            </p>
            <Link href="/Agente">
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
            className="group relative flex w-fit items-center gap-1.5 rounded-full bg-gray-950/10 px-4 py-2 text-gray-50 transition-colors hover:bg-gray-950/50 mt-5"
            >
            Explorar
            <FiArrowRight className="transition-transform group-hover:-rotate-45 group-active:-rotate-12" />
            </motion.button>

            </Link>

      </div>
    </motion.section>
  );
};

"use client";
import { ReactLenis } from "lenis/react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useScroll,
  useTransform,
  animate,
} from "framer-motion";
import { FiArrowLeft } from "react-icons/fi";
import { useRef } from "react";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from '@/lib/supabase/client';


const COLORS_TOP = ["#13FFAA", "#1E67C6", "#CE84CF", "#DD335C"];


export const SmoothScrollHero = () => {


  return (
    <div className="bg-zinc-950">
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
        <Hero />
        <Login />

      </ReactLenis>
    </div>
  );
};


const Nav = () => {
    const router = useRouter();
  return (
    <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-3 text-white">
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1 text-lg text-zinc-400"
      >
        <FiArrowLeft /> Home 
      </button>
    </nav>
  );
};

const SECTION_HEIGHT = 1500;

const Hero = () => {
  return (
    <div
      style={{ height: `calc(${SECTION_HEIGHT}px + 100vh)` }}
      className="relative w-full"
    >
      <CenterImage />
      <ParallaxImages />
      <div className="absolute bottom-0 left-0 right-0 h-96 bg-linear-to-b from-zinc-950/0 to-zinc-950" />
    </div>
  );
};

const CenterImage = () => {
  const { scrollY } = useScroll();
  const clip1 = useTransform(scrollY, [0, 1500], [25, 0]);
  const clip2 = useTransform(scrollY, [0, 1500], [75, 100]);
  const clipPath = useMotionTemplate`polygon(${clip1}% ${clip1}%, ${clip2}% ${clip1}%, ${clip2}% ${clip2}%, ${clip1}% ${clip2}%)`;
  const backgroundSize = useTransform(
    scrollY,
    [0, SECTION_HEIGHT + 500],
    ["170%", "100%"]
  );
  const opacity = useTransform(
    scrollY,
    [SECTION_HEIGHT, SECTION_HEIGHT + 500],
    [1, 0]
  );

  return (
    <motion.div
      className="sticky top-0 h-screen w-full"
      style={{
        clipPath,
        backgroundSize,
        opacity,
        backgroundImage:
            "url(https://images.unsplash.com/photo-1580254100744-c2339f2288af?q=80&w=1931&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)",
        backgroundPosition: "bottom",
        backgroundRepeat: "no-repeat",
      }}
    />
  );
};

const ParallaxImages = () => {
  return (
    <div className="mx-auto max-w-5xl px-4 pt-[200px]">
      <ParallaxImg
        src="https://images.unsplash.com/photo-1695388474402-ed805a890d8d?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="And example of a space launch"
        start={-200}
        end={200}
        className="w-1/3"
      />
      <ParallaxImg
        src="https://images.unsplash.com/photo-1753513291124-4f615bf1f6de?q=80&w=1963&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="An example of a space launch"
        start={200}
        end={-250}
        className="mx-auto w-2/3"
      />
      <ParallaxImg
        src="https://images.unsplash.com/photo-1583521214690-73421a1829a9?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Orbiting satellite"
        start={-200}
        end={200}
        className="ml-auto w-1/3"
      />
      <ParallaxImg
        src="https://images.unsplash.com/photo-1476041583396-e91e78267fb8?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="Orbiting satellite"
        start={0}
        end={-500}
        className="ml-24 w-5/12"
      />
    </div>
  );
};

const ParallaxImg = ({ className, alt, src, start, end }: {
  className?: string;
  alt: string;
  src: string;
  start: number;
  end: number;
}) => {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: [`${start}px end`, `end ${end * -1}px`],
  });

  const opacity = useTransform(scrollYProgress, [0.75, 1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0.75, 1], [1, 0.85]);

  const y = useTransform(scrollYProgress, [0, 1], [start, end]);
  const transform = useMotionTemplate`translateY(${y}px) scale(${scale})`;

  return (
    <motion.img
      src={src}
      alt={alt}
      className={className}
      ref={ref}
      style={{ transform, opacity }}
    />
  );
};

const Login = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const color = useMotionValue(COLORS_TOP[0]);
    useEffect(() => {
        animate(color, COLORS_TOP, {
          ease: "easeInOut",
          duration: 10,
          repeat: Infinity,
          repeatType: "mirror",
        });
      }, [color]);

    const handleSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!acceptTerms) {
            setError('You must accept the terms and conditions');
            return;
        }
        
        const supabase = createClient();
        setIsLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${window.location.origin}/auth/confirm`,
                    data: {
                        first_name: firstName,
                        last_name: lastName,
                    }
                }
            });
            if (error) throw error;
            router.push('/auth/sign-up-success');
        } catch (error: unknown) {
            setError(error instanceof Error ? error.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const border = useMotionTemplate`1px solid ${color}`;
    const boxShadow = useMotionTemplate`0px 4px 24px ${color}`;
    const backgroundColor = useMotionTemplate`${color}`;
    return (
      <section
        id="signin"
        className="mx-auto max-w-5xl px-4 py-48 pt-1 pb-80 text-white mt-10"
      >
        <motion.h1
          initial={{ y: 48, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ ease: "easeInOut", duration: 0.75 }}
          className="mb-20 text-7xl font-black uppercase text-zinc-50 text-center"
        >
          SIGNUP
        </motion.h1>
        <form onSubmit={handleSignUp} className="flex flex-col items-center space-y-6">
        <motion.div
            style={{ border, boxShadow }}
            className="p-[2px] rounded-md w-[450px] mx-auto mt-1"
            >
            <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-md bg-black/30 text-white px-3 py-2 backdrop-blur-sm 
                        focus:outline-none"
            />
        </motion.div>
        <motion.div
            style={{ border, boxShadow }}
            className="p-[2px] rounded-md w-[450px] mx-auto mt-1"
            >
            <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-md bg-black/30 text-white px-3 py-2 backdrop-blur-sm 
                        focus:outline-none"
            />
        </motion.div>

        <motion.div
            style={{ border, boxShadow }}
            className="p-[2px] rounded-md w-[450px] mx-auto mt-1"
            >
            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-md bg-black/30 text-white px-3 py-2 backdrop-blur-sm 
                        focus:outline-none"
            />
        </motion.div>
        <motion.div
            style={{ border, boxShadow }}
            className="p-[2px] rounded-md w-[450px] mx-auto mt-1"
            >
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-md bg-black/30 backdrop-blur-sm cursor-pointer hover:bg-black/50 transition text-white px-3 py-2  
                        focus:outline-none"
            />
        </motion.div>
        <div className="w-[450px] mx-auto mt-1">
            <label className="flex items-center gap-3 text-white cursor-pointer">
                <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="w-4 h-4 cursor-pointer"
                />
                Aceptar términos y condiciones
            </label>
        </div>
        {error && (
            <p className="text-red-400 text-sm w-[450px] text-center">{error}</p>
        )}
        <motion.button
            type="submit"
            disabled={isLoading}
            style={{ backgroundColor, boxShadow }}
            className="px-4 py-2 w-[450px] h-[45px] rounded-full font-medium text-white
             bg-black/30 backdrop-blur-sm cursor-pointer hover:bg-black/50 transition
             flex items-center justify-center mt-9 disabled:opacity-50"
            >
                {isLoading ? 'Creating account...' : 'Submit'}
        </motion.button>
        <div className="text-white text-sm">
            Already have an account?{' '}
            <Link href="/Login" className="underline text-blue-400">
                Login
            </Link>
        </div>
        </form>
      </section>
    );
  };
  

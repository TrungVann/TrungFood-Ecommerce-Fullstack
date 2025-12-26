"use client";
import useLayout from "apps/user-ui/src/hooks/useLayout";
import { MoveRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import { useEffect, useState } from "react";

const Hero = () => {
  const router = useRouter();
  const { layout } = useLayout();
  const [current, setCurrent] = useState(0);

  const banners = [
    {
      title: "Fast Food Combo",
      subtitle: "Order now & get <span class='text-yellow-400'>15%</span> OFF",
      price: "From $5 only",
      image:
        "https://images.unsplash.com/photo-1505826759037-406b40feb4cd?q=80&w=1172&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Fresh Healthy Meals",
      subtitle: "Eat clean – save <span class='text-yellow-400'>10%</span>",
      price: "Starting $8",
      image:
        "https://images.unsplash.com/photo-1695606393272-3b354f2bcbf7?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Sweet Desserts",
      subtitle: "This week only <span class='text-yellow-400'>20%</span> OFF",
      price: "From $3",
      image:
        "https://images.unsplash.com/photo-1722408156506-94e073cda214?q=80&w=1629&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
    {
      title: "Asian Street Food",
      subtitle: "Limited offer <span class='text-yellow-400'>12%</span> OFF",
      price: "From $6",
      image:
        "https://images.unsplash.com/photo-1588644525273-f37b60d78512?q=80&w=1169&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="h-[75vh] w-full overflow-hidden relative">
      {banners.map((item, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-700
        ${
          index === current
            ? "opacity-100 scale-100"
            : "opacity-0 scale-105 pointer-events-none"
        }`}
        >
          {/* Background Image */}
          <Image
            src={item.image}
            alt={item.title}
            fill
            priority
            className="object-cover"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40" />

          {/* Content */}
          <div className="relative z-10 h-full flex items-center">
            <div className="md:w-[70%] w-[90%] m-auto text-white">
              <p className="text-xl font-medium mb-2">{item.price}</p>

              <h1 className="text-5xl md:text-6xl font-extrabold leading-tight">
                {item.title}
              </h1>

              <p
                className="font-Oregano text-3xl mt-4"
                dangerouslySetInnerHTML={{ __html: item.subtitle }}
              />

              <button
                onClick={() => router.push("/products")}
                className="mt-8 w-[160px] h-[45px] bg-yellow-400 text-black font-semibold flex items-center justify-center gap-2 rounded hover:bg-yellow-300 transition"
              >
                Order Now <MoveRight size={18} />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* DOTS */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition
          ${index === current ? "bg-yellow-400 scale-110" : "bg-white/60"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Hero;

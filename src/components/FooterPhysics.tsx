"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bodies,
  Engine,
  Mouse,
  MouseConstraint,
  Render,
  Runner,
  World,
} from "matter-js";

type FooterPhysicsProps = {
  boardTextureURLs: string[];
  className?: string;
};

export function FooterPhysics({
  boardTextureURLs = [],
  className,
}: FooterPhysicsProps) {
  const scene = useRef<HTMLDivElement>(null);
  const engine = useRef(Engine.create({
    gravity: { x: 0, y: 0.5, scale: 0.001 }
  }));
  const [inView, setInView] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        setIsMobile(window.matchMedia("(max-width: 768px)").matches);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const limitedBoardTextures = isMobile
    ? boardTextureURLs.slice(0, 3)
    : boardTextureURLs;
    console.log({boards: boardTextureURLs})

  useEffect(() => {
    const currentScene = scene.current;
    if (!currentScene) {
      console.log("Scene ref not ready");
      return;
    }

    console.log("Setting up Intersection Observer");
    const observer = new IntersectionObserver(
      ([entry]) => {
        console.log("Intersection details:", {
          isIntersecting: entry.isIntersecting,
          intersectionRatio: entry.intersectionRatio,
          boundingClientRect: entry.boundingClientRect,
        });
        setInView(entry.isIntersecting);
      },
      { 
        threshold: [0, 0.1, 0.5, 1],
        rootMargin: "50px 0px"
      }
    );

    observer.observe(currentScene);
    return () => observer.unobserve(currentScene);
  }, []);

  useEffect(() => {
    if (!scene.current || !inView) {
      console.log("Scene not ready or not in view");
      return;
    }

    console.log("Initializing physics scene");
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    
    if (prefersReducedMotion) {
      console.log("Reduced motion preferred");
    }

    const cw = scene.current.clientWidth;
    const ch = scene.current.clientHeight;

    console.log("Canvas dimensions:", cw, ch);

    const render = Render.create({
      element: scene.current,
      engine: engine.current,
      options: {
        width: cw,
        height: ch,
        pixelRatio: window.devicePixelRatio,
        wireframes: false,
        background: "transparent",
      },
    });

    let boundaries = createBoundaries(cw, ch);
    World.add(engine.current.world, boundaries);

    const mouse = Mouse.create(render.canvas);
    // @ts-expect-error - matter-js types are incorrect
    mouse.element.removeEventListener("wheel", mouse.mousewheel);

    const mouseConstraint = MouseConstraint.create(engine.current, {
      mouse,
      constraint: {
        stiffness: 0.2,
        render: { visible: false },
      },
    });
    World.add(engine.current.world, mouseConstraint);

    // Add boards immediately
    const boards = limitedBoardTextures.map((texture) => {
      const x = Math.random() * (cw - 100) + 50;
      const y = Math.random() * (ch / 2 - 100) + 50;
      const rotation = ((Math.random() * 100 - 50) * Math.PI) / 180;

      return Bodies.rectangle(x, y, 80, 285, {
        chamfer: { radius: 40 },
        angle: rotation,
        restitution: 0.8,
        friction: 0.005,
        render: {
          sprite: {
            texture,
            xScale: 0.5,
            yScale: 0.5,
          },
        },
      });
    });

    console.log("Adding boards:", boards.length);
    World.add(engine.current.world, boards);

    const runner = Runner.create();
    Runner.run(runner, engine.current);
    Render.run(render);

    function onResize() {
      if (!scene.current) return;
      const cw = scene.current.clientWidth;
      const ch = scene.current.clientHeight;

      render.canvas.width = cw;
      render.canvas.height = ch;
      render.options.width = cw;
      render.options.height = ch;
      Render.setPixelRatio(render, window.devicePixelRatio);

      World.remove(engine.current.world, boundaries);
      boundaries = createBoundaries(cw, ch);
      World.add(engine.current.world, boundaries);
    }

    window.addEventListener("resize", onResize);

    function createBoundaries(width: number, height: number) {
      return [
        Bodies.rectangle(width / 2, -10, width, 20, { isStatic: true }),
        Bodies.rectangle(-10, height / 2, 20, height, { isStatic: true }),
        Bodies.rectangle(width / 2, height + 10, width, 20, { isStatic: true }),
        Bodies.rectangle(width + 10, height / 2, 20, height, { isStatic: true }),
      ];
    }

    const currentEngine = engine.current;

    return () => {
      console.log("Cleaning up physics scene");
      window.removeEventListener("resize", onResize);
      Render.stop(render);
      Runner.stop(runner);
      World.clear(currentEngine.world, false);
      Engine.clear(currentEngine);
      render.canvas.remove();
      render.textures = {};
    };
  }, [inView, limitedBoardTextures]);

  return (
    <div 
      ref={scene} 
      className={className}
    />
  );
}
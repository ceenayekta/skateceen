"use client";

import { Canvas } from "@react-three/fiber";
import { lazy, Suspense } from "react";
import { INITIAL_CAMERA_POSITION, SceneProps } from "./Scene";

const Scene = lazy(() => import("./Scene"));

export function InteractiveSkateboard({
  deckTextureURL,
  wheelTextureURL,
  truckColor,
  boltColor,
}: SceneProps) {
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center">
        <Canvas
          className="min-h-[60rem] w-full"
          camera={{ position: INITIAL_CAMERA_POSITION, fov: 55 }}
        >
      <Suspense>
      <Scene
            deckTextureURL={deckTextureURL}
            wheelTextureURL={wheelTextureURL}
            truckColor={truckColor}
            boltColor={boltColor}
          />
      </Suspense>
        </Canvas>
    </div>
  );
}
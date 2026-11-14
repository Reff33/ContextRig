import React from 'react';
import { Composition } from 'remotion';
import CinematicTitle, { CinematicTitleProps } from '../templates/remotion/CinematicTitle';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="CinematicTitle"
      component={CinematicTitle}
      durationInFrames={180}
      fps={60}
      width={1920}
      height={1080}
      defaultProps={{
        title: "KINETRIG STUDIO",
        subtitle: "AI REMOTION PRODUCTION ENGINE",
        primaryColor: "#FFFFFF",
        accentColor: "#00F0FF",
        backgroundColor: "#08090D",
        fontSize: 120,
        letterSpacing: 8,
        zoomIntensity: 1.15,
      } as CinematicTitleProps}
    />
  );
};

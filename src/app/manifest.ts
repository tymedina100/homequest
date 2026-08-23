import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HomeQuest",
    short_name: "HomeQuest",
    description: "A cozy RPG for everyday home care.",
    start_url: "/",
    display: "standalone",
    background_color: "#171a16",
    theme_color: "#171a16",
    orientation: "portrait-primary",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}

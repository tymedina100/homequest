import type { AvatarConfig, CharacterAnimationState } from "@/domain/types";
import { StudioAvatar } from "./studio-avatar";

/** Compatibility wrapper for character-focused surfaces. Room scenes use SceneAvatar directly. */
export function CharacterAvatar({ config, name, size = 96, className = "", state = "idle" }: { config: AvatarConfig; name: string; size?: number; className?: string; state?: CharacterAnimationState }) {
  return <StudioAvatar config={config} name={name} size={size} className={className} state={state} />;
}

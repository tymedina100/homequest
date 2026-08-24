import { resolveCharacterColors } from "@/domain/avatar";
import type { AvatarConfig, CharacterAnimationState } from "@/domain/types";

type SceneAvatarProps = { config: AvatarConfig; name: string; size?: number; state?: CharacterAnimationState; active?: boolean; className?: string };

function SceneHair({ config, color }: { config: AvatarConfig; color: string }) {
  if (config.accessory === "beanie") return <><path d="M28 43Q32 9 60 8Q89 9 93 43Z" fill={color} /><path d="M28 38Q60 28 93 38V50Q60 41 29 50Z" fill={color} opacity=".72" /></>;
  if (config.accessory === "cap") return <><path d="M27 44Q34 16 62 16Q86 17 94 43L89 51Q61 42 30 52Z" fill="currentColor" /><path d="M82 44Q105 44 110 54Q94 57 78 51Z" fill="currentColor" /></>;
  if (["curls", "long-curls"].includes(config.hairStyle)) return <g fill={color}>{[[31,42],[38,27],[53,21],[69,21],[84,30],[91,45],[31,61],[90,62]].map(([cx, cy], i) => <circle key={i} cx={cx} cy={cy} r="13" />)}</g>;
  if (config.hairStyle === "bun") return <><circle cx="62" cy="12" r="15" fill={color} /><path d="M29 51Q31 20 61 19Q91 20 93 51Q77 39 61 39Q46 45 29 51Z" fill={color} /></>;
  if (config.hairStyle === "ponytail") return <><path d="M29 51Q31 20 61 19Q91 20 93 51Q77 39 61 39Q46 45 29 51Z" fill={color} /><path d="M89 38Q109 45 101 80Q91 91 84 78Q98 62 89 38Z" fill={color} /></>;
  if (["medium-waves", "long-waves"].includes(config.hairStyle)) return <>
    <path d="M28 52Q30 19 61 18Q93 19 94 52Q80 42 72 31Q61 44 50 34Q42 46 28 52Z" fill={color} />
    <path d="M29 48Q25 66 30 84Q39 77 45 82L42 48ZM91 48Q96 65 90 84Q81 77 75 82L78 48Z" fill={color} />
  </>;
  if (config.hairStyle === "textured-crop" || config.hairStyle === "messy-short" || config.hairStyle === "undercut") return <path d="M29 50L33 31L42 34L47 22L54 29L62 16L70 29L81 21L82 33L91 30L94 52Q76 38 62 40Q46 50 29 50Z" fill={color} />;
  return <path d="M29 51Q31 20 61 18Q92 20 94 51Q77 38 61 39Q47 48 29 51Z" fill={color} />;
}

export function SceneAvatar({ config, name, size = 82, state = "idle", active = false, className = "" }: SceneAvatarProps) {
  const { skin, hair, clothes } = resolveCharacterColors(config);
  const sleepy = state === "sleepy" || config.expression === "sleepy";
  const happy = ["celebrate", "levelUp", "welcome"].includes(state) || config.expression === "bright" || config.expression === "excited";
  return <svg className={`scene-avatar character-avatar ${className}`} style={{ color: clothes }} width={size} height={size} viewBox="0 0 120 152" role="img" aria-label={`${name}'s character`} data-character={name} data-state={state} data-active={active}>
    <ellipse cx="60" cy="146" rx="34" ry="5" fill="rgba(18,14,12,.2)" />
    <g className="character-rig">
      <path d={config.outfit === "oversized-sweater" || config.outfit === "hoodie" ? "M20 139Q20 93 40 82H80Q100 93 100 139Z" : config.outfit === "jacket" || config.outfit === "flannel" ? "M24 139Q25 92 41 82H79Q95 92 96 139Z" : "M27 139Q28 94 42 83H78Q92 94 93 139Z"} fill={clothes} stroke="#392d29" strokeWidth="3" />
      {config.outfit === "hoodie" && <><path d="M38 86Q60 69 82 86Q75 99 60 99Q45 99 38 86Z" fill="#251f1c" opacity=".28" /><path d="M48 112H72V132H48Z" fill="#251f1c" opacity=".18" /></>}
      {(config.outfit === "jacket" || config.outfit === "flannel") && <><path d="M42 83L60 104L78 83" fill="#eadbc2" /><path d="M60 103V139" stroke="#e4c58d" strokeWidth="3" /></>}
      {config.outfit === "overalls" && <><path d="M40 85H80V139H40Z" fill="#52788b" /><path d="M44 85L49 113M76 85L71 113" stroke="#d5a75d" strokeWidth="7" /><rect x="49" y="104" width="22" height="21" rx="3" fill="#456b7e" /></>}
      {config.outfit === "apron" && <path d="M40 84Q60 96 80 84L86 139H34Z" fill="#ead9b9" />}
      {config.outfit === "button-up" && <><path d="M45 84L60 101L75 84" fill="#eadbc2" /><path d="M60 101V139" stroke="#4b3c36" strokeWidth="2" /></>}
      <path d="M40 139V147H57L59 139M61 139L63 147H80V139" fill="#302927" />
      <path d="M37 146H58V151H35Q34 148 37 146ZM62 146H83Q86 148 85 151H62Z" fill="#eee5d6" stroke="#3b312d" strokeWidth="2" />
      <path d="M49 73V88Q60 96 71 88V73Z" fill={skin} />
      <path d={config.faceShape === "angular" ? "M31 52Q32 23 60 22Q89 23 90 54Q87 80 60 90Q33 80 31 52Z" : "M29 52Q30 22 60 21Q91 22 92 54Q88 82 60 91Q32 82 29 52Z"} fill={skin} stroke="#49302a" strokeWidth="3" />
      <SceneHair config={config} color={hair} />
      {sleepy ? <path d="M43 57Q49 62 54 57M66 57Q72 62 77 57" stroke="#382725" strokeWidth="3" fill="none" /> : <><circle cx="49" cy="57" r={config.eyeStyle === "bright" ? 3 : 2.4} fill="#302321" /><circle cx="71" cy="57" r={config.eyeStyle === "bright" ? 3 : 2.4} fill="#302321" /></>}
      <path d={happy ? "M49 70Q60 82 71 70" : state === "focused" || state === "working" ? "M50 74Q60 70 70 74" : "M50 70Q60 77 70 70"} stroke="#884748" strokeWidth="3" fill="none" strokeLinecap="round" />
      {config.freckles === "soft" && <g fill="#995c47" opacity=".55"><circle cx="43" cy="66" r="1.2" /><circle cx="47" cy="67" r="1.2" /><circle cx="73" cy="67" r="1.2" /><circle cx="77" cy="66" r="1.2" /></g>}
      {config.accessory === "round-glasses" && <g fill="none" stroke="#403735" strokeWidth="3"><circle cx="48" cy="57" r="9" /><circle cx="72" cy="57" r="9" /><path d="M57 57H63" /></g>}
      {config.accessory === "rectangle-glasses" && <g fill="none" stroke="#403735" strokeWidth="3"><rect x="38" y="49" width="20" height="16" rx="4" /><rect x="62" y="49" width="20" height="16" rx="4" /><path d="M58 57H62" /></g>}
      {config.accessory === "headband" && <path d="M32 42Q60 21 89 42" fill="none" stroke={clothes} strokeWidth="6" />}
      {config.accessory === "earrings" && <><circle cx="30" cy="68" r="3" fill="#d5ad55" /><circle cx="90" cy="68" r="3" fill="#d5ad55" /></>}
      {config.accessory === "hair-clip" && <path d="M82 41L91 35L94 45Z" fill="#edc568" />}
      {config.accessory === "necklace" && <circle cx="60" cy="92" r="3" fill="#d5ad55" />}
      <g className="character-state-mark" aria-hidden="true"><circle cx="96" cy="28" r="10" /><path d="M91 28L95 32L102 23" /></g>
    </g>
  </svg>;
}

import type { AvatarConfig } from "@/domain/types";

const skin = { porcelain: "#f8d9c6", peach: "#edbd9f", golden: "#d99a62", warm: "#ba744d", brown: "#845036", deep: "#543427" };
const hair = { espresso: "#2b1b18", chestnut: "#5a3025", copper: "#a95732", golden: "#c9913b", midnight: "#25243a", rose: "#8c3f57" };
const outfit = { moss: "#66745b", amber: "#b87835", berry: "#995064", ocean: "#496f83", plum: "#6d536f", cream: "#d9c9aa" };

export function CharacterAvatar({ config, name, size = 96, className = "" }: { config: AvatarConfig; name: string; size?: number; className?: string }) {
  const face = skin[config.skinTone]; const hairColor = hair[config.hairColor]; const clothes = outfit[config.outfitColor];
  const mouth = config.expression === "bright" ? "M42 55 Q50 64 58 55" : config.expression === "focused" ? "M44 58 L56 58" : config.expression === "sleepy" ? "M45 59 Q50 56 55 59" : "M44 56 Q50 61 56 56";
  return <svg className={`character-avatar ${className}`} width={size} height={size} viewBox="0 0 100 112" role="img" aria-label={`${name}'s character`}>
    <ellipse cx="50" cy="106" rx="32" ry="5" fill="rgba(20,18,16,.16)" />
    <path d={config.outfit === "overalls" ? "M24 106 Q25 76 37 70 L63 70 Q75 76 76 106Z" : "M20 106 Q22 77 38 70 L62 70 Q78 77 80 106Z"} fill={clothes} />
    {config.outfit === "apron" && <path d="M37 74H63L67 106H33Z" fill="#efe4cf" opacity=".9" />}
    {config.outfit === "overalls" && <><path d="M35 73L40 105M65 73L60 105" stroke="#d8b278" strokeWidth="6" /><rect x="41" y="83" width="18" height="18" rx="3" fill="#d8b278" /></>}
    {config.outfit === "hoodie" && <path d="M32 78Q50 66 68 78" fill="none" stroke="rgba(255,255,255,.32)" strokeWidth="4" />}
    <rect x="43" y="65" width="14" height="15" rx="7" fill={face} />
    <circle cx="50" cy="43" r="27" fill={face} />
    <circle cx="24" cy="45" r="5" fill={face} /><circle cx="76" cy="45" r="5" fill={face} />
    {config.hairStyle === "short" && <path d="M25 39Q25 13 50 12Q76 13 75 40Q65 27 52 25Q38 32 25 39Z" fill={hairColor} />}
    {config.hairStyle === "waves" && <path d="M23 47Q18 14 48 12Q79 10 78 52L68 63Q70 36 59 25Q45 31 27 25Q31 43 23 47Z" fill={hairColor} />}
    {config.hairStyle === "curls" && <g fill={hairColor}>{[[27,32],[31,21],[43,16],[57,16],[69,23],[74,35],[24,45],[76,47]].map(([x,y], index)=><circle key={index} cx={x} cy={y} r="10" />)}</g>}
    {config.hairStyle === "bun" && <><circle cx="50" cy="10" r="13" fill={hairColor} /><path d="M25 38Q27 13 50 14Q73 14 75 39Q61 27 50 27Q38 29 25 38Z" fill={hairColor} /></>}
    {config.hairStyle === "mohawk" && <path d="M32 25Q35 5 48 4Q62 7 68 27Q51 20 32 25Z" fill={hairColor} />}
    <path d={config.expression === "sleepy" ? "M34 46Q39 43 44 46M56 46Q61 43 66 46" : "M35 45Q39 42 43 45M57 45Q61 42 65 45"} fill="none" stroke="#3d2a27" strokeWidth="2.4" strokeLinecap="round" />
    {config.expression !== "sleepy" && <><circle cx="40" cy="45" r="1.8" fill="#2b2220" /><circle cx="60" cy="45" r="1.8" fill="#2b2220" /></>}
    <path d={mouth} fill="none" stroke="#7a3e3f" strokeWidth="2" strokeLinecap="round" />
    {config.accessory === "glasses" && <g fill="none" stroke="#493d3a" strokeWidth="2"><circle cx="39" cy="46" r="8" /><circle cx="61" cy="46" r="8" /><path d="M47 46H53" /></g>}
    {config.accessory === "earrings" && <><circle cx="24" cy="51" r="2.5" fill="#d7ad4c" /><circle cx="76" cy="51" r="2.5" fill="#d7ad4c" /></>}
    {config.accessory === "headband" && <path d="M27 29Q50 14 73 29" fill="none" stroke={clothes} strokeWidth="4" />}
    {config.accessory === "cap" && <><path d="M29 26Q48 10 69 25L65 31H29Z" fill={clothes} /><path d="M63 28Q76 29 79 34Q68 35 59 32Z" fill={clothes} /></>}
  </svg>;
}

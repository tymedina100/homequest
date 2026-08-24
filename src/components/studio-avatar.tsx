import { isHeadwear, resolveCharacterColors } from "@/domain/avatar";
import type { AvatarConfig, CharacterAnimationState } from "@/domain/types";

type StudioAvatarProps = {
  config: AvatarConfig;
  name: string;
  size?: number;
  className?: string;
  state?: CharacterAnimationState;
  active?: boolean;
};

function HairBack({ config, color }: { config: AvatarConfig; color: string }) {
  if (isHeadwear(config.accessory)) return <path d="M73 92Q70 31 120 28Q171 31 167 94L157 127H83Z" fill={color} />;
  switch (config.hairStyle) {
    case "long-curls": return <g fill={color}>{[[78,69],[75,91],[78,114],[91,129],[149,129],[163,112],[165,88],[158,65]].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="22" />)}</g>;
    case "long-waves": return <path d="M75 75Q72 28 120 26Q171 28 166 82L172 138Q153 130 144 139Q126 129 109 139Q91 128 70 138Q79 107 75 75Z" fill={color} />;
    case "ponytail": return <><path d="M77 75Q75 30 120 27Q166 30 163 78L155 106H83Z" fill={color} /><path d="M157 65Q190 72 178 121Q166 142 151 125Q171 104 157 65Z" fill={color} /></>;
    case "bun": return <><circle cx="122" cy="20" r="24" fill={color} /><path d="M76 78Q74 31 120 28Q167 31 164 80L155 105H83Z" fill={color} /></>;
    case "medium-waves": return <path d="M76 77Q73 30 120 27Q169 30 165 82L157 115Q145 105 136 116Q121 105 107 116Q94 105 81 113Z" fill={color} />;
    case "curls": return <g fill={color}>{[[83,65],[91,43],[112,34],[135,36],[155,49],[163,71],[157,94],[82,93]].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="20" />)}</g>;
    default: return null;
  }
}

function HairFront({ config, color }: { config: AvatarConfig; color: string }) {
  if (config.accessory === "beanie") return <><path d="M80 57Q84 12 120 10Q158 12 163 57Z" fill={color} /><path d="M80 51Q120 39 163 51L161 68Q120 57 82 68Z" fill={color} opacity=".75" /></>;
  if (config.accessory === "cap") return <><path d="M78 54Q89 18 126 20Q155 22 164 53L158 65Q121 53 82 66Z" fill="currentColor" /><path d="M145 55Q177 55 184 68Q162 71 139 64Z" fill="currentColor" /></>;
  switch (config.hairStyle) {
    case "textured-crop": return <path d="M79 65L85 43L95 47L101 34L111 40L120 29L130 40L141 34L147 47L160 43L163 69Q145 56 128 57Q105 67 79 65Z" fill={color} />;
    case "side-part": return <path d="M78 68Q79 31 119 28Q156 29 164 66Q142 48 119 48Q99 63 78 68Z" fill={color} />;
    case "messy-short": return <path d="M78 67Q78 34 99 31L104 19L115 29L125 16L132 31L147 22L146 37Q161 42 164 69Q143 51 124 54Q103 66 78 67Z" fill={color} />;
    case "medium-waves": case "long-waves": return <path d="M78 67Q81 29 120 27Q159 29 164 67Q150 56 143 44Q129 59 113 46Q100 61 78 67Z" fill={color} />;
    case "curls": case "long-curls": return <g fill={color}>{[[83,61],[91,43],[108,35],[126,34],[145,42],[158,59]].map(([cx, cy], index) => <circle key={index} cx={cx} cy={cy} r="17" />)}</g>;
    case "ponytail": return <path d="M79 66Q81 30 120 27Q158 30 162 66Q145 55 135 43Q120 58 106 46Q95 60 79 66Z" fill={color} />;
    case "bun": return <path d="M79 66Q82 30 120 27Q158 30 162 66Q145 55 134 44Q120 57 106 45Q94 59 79 66Z" fill={color} />;
    case "undercut": return <><path d="M79 68Q78 39 95 35L102 22L112 31L123 18L132 32L146 24L145 39Q161 46 163 68Q140 51 116 53Q99 63 79 68Z" fill={color} /><path d="M80 63Q83 83 91 91" stroke={color} strokeWidth="8" /></>;
  }
}

function Outfit({ config, skin, clothes }: { config: AvatarConfig; skin: string; clothes: string }) {
  const dark = "#302927";
  const base = <path d="M71 272Q72 192 88 165Q102 153 120 153Q139 153 152 165Q169 193 170 272Z" fill={clothes} />;
  return <g className={`studio-outfit outfit-${config.outfit}`}>
    {base}
    {config.outfit === "tee" && <><path d="M72 192Q58 202 55 232L74 236L83 195Z" fill={clothes} /><path d="M168 192Q182 202 185 232L166 236L157 195Z" fill={clothes} /><circle cx="63" cy="235" r="9" fill={skin} /><circle cx="177" cy="235" r="9" fill={skin} /></>}
    {config.outfit === "crewneck" && <><path d="M72 183Q57 191 55 236L78 239L86 190Z" fill={clothes} /><path d="M168 183Q183 191 185 236L162 239L154 190Z" fill={clothes} /><path d="M100 162Q120 179 140 162" fill="none" stroke="#f1ddba" strokeOpacity=".45" strokeWidth="5" /></>}
    {config.outfit === "hoodie" && <><path d="M78 180Q55 188 54 244L82 246L88 188Z" fill={clothes} /><path d="M162 180Q185 188 186 244L158 246L152 188Z" fill={clothes} /><path d="M88 167Q120 145 152 167Q145 186 120 188Q95 186 88 167Z" fill="#251f1c" opacity=".28" /><path d="M112 174V205M128 174V205" stroke="#eee0c5" strokeWidth="3" /><path d="M91 226Q120 213 149 226V251H91Z" fill="#251f1c" opacity=".17" /></>}
    {config.outfit === "oversized-sweater" && <><path d="M78 177Q51 184 49 249Q64 258 85 246L91 191Z" fill={clothes} /><path d="M162 177Q189 184 191 249Q176 258 155 246L149 191Z" fill={clothes} /><path d="M81 254Q120 266 159 254" stroke="#f2dec0" strokeOpacity=".25" strokeWidth="6" /></>}
    {config.outfit === "jacket" && <><path d="M70 181Q56 193 58 252L91 260L102 169Z" fill="#322d29" /><path d="M170 181Q184 193 182 252L149 260L138 169Z" fill="#322d29" /><path d="M104 164L120 191L136 164" fill="#e9d8bb" opacity=".8" /><path d="M120 190V270" stroke="#c2a471" strokeWidth="3" /></>}
    {config.outfit === "flannel" && <><path d="M70 181Q55 194 57 252L91 260L102 169Z" fill={clothes} /><path d="M170 181Q185 194 183 252L149 260L138 169Z" fill={clothes} /><path d="M73 205H98M66 229H94M142 205H167M146 229H175M120 180V270" stroke="#f4d6ad" strokeOpacity=".42" strokeWidth="4" /><path d="M100 164L120 187L140 164" fill="#e7d8bf" /></>}
    {config.outfit === "overalls" && <><path d="M85 160H155L163 272H77Z" fill="#4f7180" /><path d="M92 161L99 215M148 161L141 215" stroke="#d4aa65" strokeWidth="9" /><path d="M96 191H144V246H96Z" fill="#567f92" /><path d="M106 208H134V229H106Z" fill="#406373" /></>}
    {config.outfit === "apron" && <><path d="M86 158Q120 174 154 158L162 272H78Z" fill="#ead9b9" /><path d="M96 158Q120 185 144 158" fill="none" stroke={clothes} strokeWidth="8" /><path d="M93 226H147V250Q120 259 93 250Z" fill={clothes} opacity=".42" /></>}
    {config.outfit === "button-up" && <><path d="M99 161L120 182L141 161" fill="#efe0c7" /><path d="M120 180V271" stroke="#3b302d" strokeOpacity=".4" strokeWidth="3" />{[200,220,240].map((cy) => <circle key={cy} cx="120" cy={cy} r="3" fill="#e8d6b6" />)}</>}
    {config.outfit === "lounge" && <><path d="M76 184Q55 194 57 244L84 248L91 191Z" fill={clothes} /><path d="M164 184Q185 194 183 244L156 248L149 191Z" fill={clothes} /><path d="M91 205Q120 216 149 205M92 229Q120 240 148 229" stroke="#f1ddba" strokeOpacity=".35" strokeWidth="5" /></>}
    <path d="M88 272L85 291H116L119 272M121 272L124 291H155L152 272" fill={dark} />
    <path d="M82 286Q99 281 118 288V298H81Q78 293 82 286ZM122 288Q141 281 158 286Q162 293 159 298H122Z" fill="#eee5d6" stroke="#403834" strokeWidth="3" />
  </g>;
}

function Face({ config, skin }: { config: AvatarConfig; skin: string }) {
  const head = config.faceShape === "angular" ? "M81 76Q82 37 120 35Q159 37 160 77Q158 116 120 136Q82 116 81 76Z" : config.faceShape === "oval" ? "M82 76Q82 35 120 35Q158 35 158 78Q156 129 120 137Q84 128 82 76Z" : config.faceShape === "soft" ? "M79 76Q80 37 120 35Q161 37 161 78Q158 124 120 136Q82 124 79 76Z" : "M78 78Q78 37 120 35Q162 37 162 78Q158 126 120 136Q82 126 78 78Z";
  const sleepy = config.expression === "sleepy";
  const excited = config.expression === "excited";
  const focused = config.expression === "focused" || config.expression === "determined";
  const eyePath = config.eyeStyle === "almond" ? "M95 82Q103 76 111 82Q103 88 95 82ZM129 82Q137 76 145 82Q137 88 129 82Z" : config.eyeStyle === "bright" ? "M96 82Q103 73 110 82Q103 91 96 82ZM130 82Q137 73 144 82Q137 91 130 82Z" : "M96 83Q103 77 110 83M130 83Q137 77 144 83";
  return <g className="studio-face">
    <path d={head} fill={skin} stroke="#4a3028" strokeWidth="3" />
    <circle cx="79" cy="84" r="8" fill={skin} /><circle cx="161" cy="84" r="8" fill={skin} />
    <path d={focused ? "M94 69L110 73M146 69L130 73" : "M95 72Q103 68 111 72M129 72Q137 68 145 72"} stroke="#4a3028" strokeWidth="3" fill="none" strokeLinecap="round" />
    {sleepy ? <path d="M96 83Q103 88 110 83M130 83Q137 88 144 83" stroke="#392725" strokeWidth="3" fill="none" /> : <path d={eyePath} stroke="#392725" strokeWidth="3" fill={config.eyeStyle === "calm" ? "none" : "#392725"} strokeLinecap="round" />}
    {config.freckles === "soft" && <g fill="#9a5c48" opacity=".55">{[93,99,105,135,141,147].map((cx) => <circle key={cx} cx={cx} cy="96" r="1.5" />)}</g>}
    <path d={excited ? "M105 106Q120 125 135 106Q120 132 105 106Z" : config.expression === "bright" ? "M104 106Q120 122 136 106" : focused ? "M107 112Q120 108 133 112" : sleepy ? "M108 113Q120 107 132 113" : "M107 108Q120 119 133 108"} stroke="#8a4949" strokeWidth="3" fill={excited ? "#7b3c3d" : "none"} strokeLinecap="round" />
  </g>;
}

function Accessory({ config, clothes }: { config: AvatarConfig; clothes: string }) {
  switch (config.accessory) {
    case "round-glasses": return <g fill="none" stroke="#423735" strokeWidth="4"><circle cx="103" cy="83" r="13" /><circle cx="137" cy="83" r="13" /><path d="M116 83H124" /></g>;
    case "rectangle-glasses": return <g fill="none" stroke="#423735" strokeWidth="4"><rect x="89" y="72" width="27" height="21" rx="6" /><rect x="124" y="72" width="27" height="21" rx="6" /><path d="M116 82H124" /></g>;
    case "earrings": return <><circle cx="78" cy="96" r="5" fill="#d5ad55" /><circle cx="162" cy="96" r="5" fill="#d5ad55" /></>;
    case "headband": return <path d="M82 57Q120 28 159 57" fill="none" stroke={clothes} strokeWidth="8" />;
    case "necklace": return <><path d="M103 153Q120 174 137 153" stroke="#d5ad55" strokeWidth="3" fill="none" /><circle cx="120" cy="169" r="4" fill="#d5ad55" /></>;
    case "hair-clip": return <path d="M150 58L162 50L166 63Z" fill="#edc568" stroke="#4b352e" strokeWidth="2" />;
    default: return null;
  }
}

export function StudioAvatar({ config, name, size = 260, className = "", state = "idle", active = false }: StudioAvatarProps) {
  const { skin, hair, clothes } = resolveCharacterColors(config);
  const expression = state === "sleepy" ? { ...config, expression: "sleepy" as const } : state === "focused" || state === "working" ? { ...config, expression: "focused" as const } : state === "celebrate" || state === "levelUp" || state === "welcome" ? { ...config, expression: "excited" as const } : config;
  return <svg className={`studio-avatar character-avatar ${className}`} style={{ color: clothes }} width={size} height={size} viewBox="0 0 240 305" role="img" aria-label={`${name}'s character`} data-character={name} data-state={state} data-active={active}>
    <ellipse cx="120" cy="297" rx="65" ry="8" fill="rgba(20,16,14,.18)" />
    <g className="character-rig">
      <HairBack config={config} color={hair} />
      <Outfit config={config} skin={skin} clothes={clothes} />
      <path d="M104 137V163Q120 174 136 163V137Z" fill={skin} stroke="#4a3028" strokeWidth="3" />
      <Face config={expression} skin={skin} />
      <HairFront config={config} color={hair} />
      <Accessory config={config} clothes={clothes} />
      <g className="character-state-mark" aria-hidden="true"><circle cx="181" cy="40" r="14" /><path d="M174 40L179 45L188 34" /></g>
    </g>
  </svg>;
}

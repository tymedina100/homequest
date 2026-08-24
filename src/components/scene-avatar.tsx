import { isHeadwear, resolveCharacterColors } from "@/domain/avatar";
import type { AvatarConfig, CharacterAnimationState } from "@/domain/types";

type SceneAvatarProps = { config: AvatarConfig; name: string; size?: number; state?: CharacterAnimationState; active?: boolean; className?: string };

const INK = "#33241f";
const CREAM = "#f5ead5";
const tone = (color: string, mix: string, amount: number) => `color-mix(in srgb, ${color} ${amount}%, ${mix})`;

function HairBack({ config, color }: { config: AvatarConfig; color: string }) {
  const shade = tone(color, "#160e0d", 72);
  if (isHeadwear(config.accessory)) {
    if (config.hairStyle === "long-curls" || config.hairStyle === "curls") return <g fill={shade} stroke={INK} strokeWidth="2.8">{[[43,45],[39,61],[40,78],[47,93],[59,101],[81,101],[93,94],[101,79],[102,61],[97,45]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="14" />)}</g>;
    if (config.hairStyle === "long-waves" || config.hairStyle === "medium-waves") return <path d="M40 60Q40 23 70 20Q101 23 101 62L106 100Q96 94 87 102Q78 95 69 103Q58 95 49 102Q42 95 35 100Q40 80 40 60Z" fill={shade} stroke={INK} strokeWidth="3" />;
    if (config.hairStyle === "ponytail") return <g><path d="M40 61Q40 24 70 21Q101 24 101 63L96 88H44Z" fill={shade} stroke={INK} strokeWidth="3" /><path d="M97 44Q119 47 116 80Q113 99 99 105Q90 98 96 89Q108 74 97 44Z" fill={shade} stroke={INK} strokeWidth="3" /></g>;
    if (config.hairStyle === "bun") return <g><circle cx="71" cy="16" r="16" fill={shade} stroke={INK} strokeWidth="3" /><path d="M40 61Q40 24 70 21Q101 24 101 63L96 88H44Z" fill={shade} stroke={INK} strokeWidth="3" /></g>;
    return <path d="M40 62Q40 24 70 21Q101 24 101 65L96 92Q86 86 78 92Q69 86 61 92Q50 85 42 92Z" fill={shade} stroke={INK} strokeWidth="3" />;
  }
  if (config.hairStyle === "long-curls") return <g fill={shade} stroke={INK} strokeWidth="2.7">{[[43,49],[39,66],[42,84],[53,98],[70,102],[88,98],[100,85],[102,66],[97,49]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="15" />)}</g>;
  if (config.hairStyle === "curls") return <g fill={shade} stroke={INK} strokeWidth="2.7">{[[43,49],[48,34],[62,27],[78,27],[93,36],[99,51],[96,67],[43,67]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="14" />)}</g>;
  if (config.hairStyle === "long-waves" || config.hairStyle === "medium-waves") return <path d="M39 60Q39 23 70 20Q102 23 102 62L106 101Q96 95 88 102Q78 95 69 103Q59 95 50 102Q43 96 35 101Q40 80 39 60Z" fill={shade} stroke={INK} strokeWidth="3" />;
  if (config.hairStyle === "ponytail") return <g><path d="M40 61Q40 24 70 21Q101 24 101 63L96 87H44Z" fill={shade} stroke={INK} strokeWidth="3" /><path d="M98 45Q121 48 116 82Q113 101 99 105Q89 98 96 89Q108 75 98 45Z" fill={shade} stroke={INK} strokeWidth="3" /></g>;
  if (config.hairStyle === "bun") return <g><circle cx="71" cy="16" r="17" fill={shade} stroke={INK} strokeWidth="3" /><path d="M40 61Q40 24 70 21Q101 24 101 63L96 87H44Z" fill={shade} stroke={INK} strokeWidth="3" /></g>;
  return null;
}

function HairFront({ config, color }: { config: AvatarConfig; color: string }) {
  const highlight = tone(color, "#f2c28a", 84);
  if (config.accessory === "beanie") return <g><path d="M42 51Q49 45 57 51L54 62Q47 64 42 57ZM92 50Q99 47 102 55L98 64Q92 60 92 50Z" fill={color} stroke={INK} strokeWidth="2.2" /><path d="M40 46Q43 11 70 9Q99 11 102 46Z" fill="currentColor" stroke={INK} strokeWidth="3.1" /><path d="M39 41Q70 33 103 41L101 53Q70 46 40 53Z" fill={tone("currentColor", "#1d1715", 76)} stroke={INK} strokeWidth="3" /><path d="M48 44V51M59 41V50M70 39V49M81 40V50M92 43V51" stroke={tone("currentColor", "#fff", 82)} strokeOpacity=".22" strokeWidth="1.7" /><path d="M43 51Q51 45 60 52M91 51Q97 47 102 52" fill={color} stroke={INK} strokeLinecap="round" strokeWidth="2.2" /></g>;
  if (config.accessory === "cap") return <g><path d="M41 50Q49 44 58 51L54 63Q46 64 42 57ZM91 48Q99 46 103 54L98 64Q92 60 91 48Z" fill={color} stroke={INK} strokeWidth="2.3" /><path d="M39 45Q44 16 71 15Q95 16 103 42L100 52Q71 44 41 54Z" fill="currentColor" stroke={INK} strokeLinejoin="round" strokeWidth="3.1" /><path d="M82 43Q107 41 119 52Q104 58 81 52Z" fill={tone("currentColor", "#171210", 75)} stroke={INK} strokeLinejoin="round" strokeWidth="3" /><path d="M46 49Q55 42 64 48" fill="none" stroke={tone("currentColor", "#fff", 82)} strokeOpacity=".28" strokeWidth="2" /><path d="M42 52Q50 46 59 52M92 51Q98 47 103 52" fill={color} stroke={INK} strokeLinecap="round" strokeWidth="2.3" /></g>;
  let shape: React.ReactNode;
  if (config.hairStyle === "textured-crop") shape = <path d="M40 55L44 39L51 42L55 31L63 36L70 25L77 36L86 29L89 40L98 37L102 57Q87 46 74 47Q58 57 40 55Z" />;
  else if (config.hairStyle === "messy-short" || config.hairStyle === "undercut") shape = <path d="M39 56Q40 32 53 29L58 20L65 28L72 18L78 29L88 22L88 32Q99 36 102 57Q86 44 72 46Q56 57 39 56Z" />;
  else if (config.hairStyle === "side-part") shape = <path d="M40 57Q41 24 70 21Q97 23 102 55Q87 40 70 41Q57 53 40 57Z" />;
  else if (config.hairStyle === "curls" || config.hairStyle === "long-curls") shape = <g>{[[43,49],[49,36],[62,29],[77,29],[91,37],[98,50]].map(([cx,cy],i)=><circle key={i} cx={cx} cy={cy} r="12" />)}</g>;
  else shape = <path d="M40 56Q42 24 70 21Q98 24 101 57Q90 48 83 37Q73 50 62 40Q54 52 40 56Z" />;
  return <g fill={color} stroke={INK} strokeLinejoin="round" strokeWidth="3">{shape}<path d="M52 37Q58 31 64 31M69 29Q75 24 81 30M85 34Q90 31 94 37" fill="none" stroke={highlight} strokeLinecap="round" strokeOpacity=".28" strokeWidth="2.2" /></g>;
}

function Body({ config, skin, clothes }: { config: AvatarConfig; skin: string; clothes: string }) {
  const shade = tone(clothes, "#211916", 72);
  const light = tone(clothes, "#fff0d0", 82);
  const shortSleeve = config.outfit === "tee" || config.outfit === "overalls";
  const pants = config.outfit === "overalls" ? "#41687b" : "#343638";
  const wide = config.outfit === "hoodie" || config.outfit === "oversized-sweater" || config.outfit === "lounge";
  const sleeve = config.outfit === "overalls" ? "#e4d1af" : config.outfit === "jacket" ? "#343739" : config.outfit === "button-up" ? light : clothes;
  const outer = wide ? "M43 93Q70 82 97 93L108 117L99 126L101 151Q70 159 39 151L41 126L32 117Z" : "M46 93Q70 84 94 93L103 117L96 126L96 150Q70 157 44 150L44 126L37 117Z";
  return <g className={`scene-outfit outfit-${config.outfit}`}>
    <path d="M45 145Q57 141 69 146L67 173H43Q41 158 45 145ZM71 146Q83 141 95 145Q99 158 97 173H73Z" fill={pants} stroke={INK} strokeWidth="3" />
    <path d="M40 169Q54 166 69 171V179H38Q36 173 40 169ZM71 171Q86 166 100 169Q104 174 102 179H71Z" fill={CREAM} stroke={INK} strokeWidth="3" />
    {shortSleeve ? <><path className="character-arm-left" d="M46 95Q32 98 29 118L27 132L39 135L47 111Z" fill={sleeve} stroke={INK} strokeWidth="3" /><path d="M27 130L24 148Q27 154 34 151L39 134Z" fill={skin} stroke={INK} strokeWidth="2.7" /><path className="character-arm-right" d="M94 95Q108 98 111 118L113 132L101 135L93 111Z" fill={sleeve} stroke={INK} strokeWidth="3" /><path d="M113 130L116 148Q113 154 106 151L101 134Z" fill={skin} stroke={INK} strokeWidth="2.7" /></> : <><path className="character-arm-left" d="M45 95Q29 99 27 123L23 145Q26 153 34 150L43 119Z" fill={sleeve} stroke={INK} strokeWidth="3" /><path className="character-arm-right" d="M95 95Q111 99 113 123L117 145Q114 153 106 150L97 119Z" fill={sleeve} stroke={INK} strokeWidth="3" /><circle cx="28" cy="149" r="6" fill={skin} stroke={INK} strokeWidth="2.5" /><circle cx="112" cy="149" r="6" fill={skin} stroke={INK} strokeWidth="2.5" /></>}
    <path d={outer} fill={clothes} stroke={INK} strokeLinejoin="round" strokeWidth="3.2" />
    {config.outfit === "hoodie" && <><path d="M49 94Q70 80 91 94Q87 108 70 110Q53 108 49 94Z" fill={shade} stroke={INK} strokeWidth="2.5" /><path d="M62 103V121M78 103V121" stroke={CREAM} strokeWidth="2.3" /><path d="M51 132Q70 123 89 132V148Q70 153 51 148Z" fill={shade} stroke={INK} strokeWidth="2.2" /></>}
    {config.outfit === "crewneck" && <path d="M57 92Q70 104 83 92" fill="none" stroke={light} strokeOpacity=".58" strokeWidth="4" />}
    {config.outfit === "oversized-sweater" && <><path d="M56 92Q70 106 84 92" fill="none" stroke={light} strokeOpacity=".5" strokeWidth="4.5" /><path d="M43 144Q70 152 98 144" stroke={shade} strokeWidth="4" /></>}
    {config.outfit === "jacket" && <><path d="M47 94L61 91L70 112L79 91L94 94L95 149Q82 155 70 150Q58 155 45 149Z" fill="#343739" stroke={INK} strokeWidth="2.7" /><path d="M57 92L70 112L83 92L88 148Q79 152 70 149Q61 152 52 148Z" fill={clothes} stroke={INK} strokeWidth="2.3" /><path d="M70 111V150" stroke="#d2a85e" strokeWidth="2" /></>}
    {config.outfit === "flannel" && <><path d="M54 92L70 111L86 92L91 149Q80 153 70 150Q60 153 49 149Z" fill="#d9c6a5" stroke={INK} strokeWidth="2.2" /><path d="M44 113H58M41 130H55M82 113H98M85 130H101M70 111V150" stroke={light} strokeOpacity=".58" strokeWidth="2.2" /></>}
    {config.outfit === "overalls" && <><path d="M48 95H92V150H48Z" fill="#4c778c" stroke={INK} strokeWidth="2.7" /><path d="M52 94L58 116M88 94L82 116" stroke="#d8aa61" strokeWidth="6" /><path d="M56 112H84V142H56Z" fill="#567f92" stroke={INK} strokeWidth="2.2" /><path d="M62 122H78V135H62Z" fill="#3f6678" /></>}
    {config.outfit === "apron" && <><path d="M53 93Q70 106 87 93L92 154Q70 160 48 154Z" fill="#ead9b9" stroke={INK} strokeWidth="2.8" /><path d="M56 132H84V148Q70 153 56 148Z" fill={tone(clothes,"#ead9b9",45)} stroke={INK} strokeWidth="2" /></>}
    {config.outfit === "button-up" && <><path d="M55 92L70 109L85 92L90 150Q80 154 70 151Q60 154 50 150Z" fill={light} stroke={INK} strokeWidth="2.4" /><path d="M70 109V151" stroke="#594037" strokeWidth="1.8" />{[121,133,145].map(cy=><circle key={cy} cx="70" cy={cy} r="1.8" fill="#594037" />)}</>}
    {config.outfit === "lounge" && <path d="M46 117Q70 126 95 117M43 136Q70 145 98 136" fill="none" stroke={light} strokeOpacity=".4" strokeWidth="3" />}
  </g>;
}

function Face({ config, skin, state }: { config: AvatarConfig; skin: string; state: CharacterAnimationState }) {
  const shade = tone(skin, "#8a4938", 81);
  const sleepy = state === "sleepy" || config.expression === "sleepy";
  const happy = ["celebrate", "levelUp", "welcome"].includes(state) || config.expression === "bright" || config.expression === "excited";
  const focused = state === "focused" || state === "working" || config.expression === "focused" || config.expression === "determined";
  const head = config.faceShape === "angular" ? "M42 56Q43 26 70 24Q97 26 99 58Q96 82 83 91Q73 99 70 100Q65 99 55 92Q44 83 42 56Z" : config.faceShape === "oval" ? "M43 55Q44 25 70 23Q96 25 97 58Q95 93 70 100Q45 93 43 55Z" : config.faceShape === "soft" ? "M39 56Q40 26 70 23Q100 26 101 59Q98 87 83 96Q76 101 70 102Q63 101 56 97Q42 88 39 56Z" : "M39 57Q39 26 70 23Q101 26 101 59Q99 91 70 101Q41 91 39 57Z";
  return <g><path d={head} fill={skin} stroke={INK} strokeWidth="3.2" /><path d="M47 77Q54 94 70 98Q48 91 44 72Z" fill={shade} opacity=".2" /><path d="M42 57Q33 57 35 67Q37 75 43 72M98 57Q107 57 105 67Q103 75 97 72" fill={skin} stroke={INK} strokeWidth="2.7" /><path d={focused ? "M51 50L62 53M89 50L78 53" : "M50 51Q56 47 62 50M78 50Q84 47 90 51"} fill="none" stroke={INK} strokeLinecap="round" strokeWidth="2.7" />{sleepy ? <path d="M51 61Q57 66 63 61M77 61Q83 66 89 61" fill="none" stroke={INK} strokeLinecap="round" strokeWidth="2.7" /> : <g><path d="M50 59Q57 54 64 59Q57 68 50 59ZM76 59Q83 54 90 59Q83 68 76 59Z" fill="#fff8e7" stroke={INK} strokeWidth="2" /><circle cx="58" cy="60" r="3" fill={INK} /><circle cx="82" cy="60" r="3" fill={INK} /><circle cx="59" cy="59" r=".9" fill="#fff" /><circle cx="83" cy="59" r=".9" fill="#fff" /></g>}<path d="M70 63Q67 70 71 71Q74 71 76 69" fill="none" stroke={shade} strokeWidth="1.8" />{config.freckles === "soft" && <g fill="#8b5040" opacity=".55"><circle cx="51" cy="73" r="1" /><circle cx="55" cy="74" r="1" /><circle cx="85" cy="74" r="1" /><circle cx="89" cy="73" r="1" /></g>}<path d={happy ? "M57 78Q70 91 83 78" : focused ? "M60 82Q70 78 80 82" : sleepy ? "M61 82Q70 78 79 82" : "M59 79Q70 87 81 79"} fill="none" stroke="#914b49" strokeLinecap="round" strokeWidth="2.7" /></g>;
}

function Accessory({ config }: { config: AvatarConfig }) {
  if (config.accessory === "round-glasses") return <g fill="none" stroke={INK} strokeWidth="2.6"><circle cx="58" cy="60" r="9" /><circle cx="82" cy="60" r="9" /><path d="M67 60Q70 58 73 60M49 58L43 57M91 58L97 57" /></g>;
  if (config.accessory === "rectangle-glasses") return <g fill="none" stroke={INK} strokeWidth="2.6"><rect x="47" y="53" width="20" height="16" rx="5" /><rect x="73" y="53" width="20" height="16" rx="5" /><path d="M67 60Q70 58 73 60" /></g>;
  if (config.accessory === "headband") return <path d="M43 48Q70 25 97 48" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="7" />;
  if (config.accessory === "earrings") return <><circle cx="41" cy="73" r="3.5" fill="#d8aa52" stroke={INK} strokeWidth="1.7" /><circle cx="99" cy="73" r="3.5" fill="#d8aa52" stroke={INK} strokeWidth="1.7" /></>;
  if (config.accessory === "hair-clip") return <path d="M91 44L100 38L103 48L94 50Z" fill="#efc768" stroke={INK} strokeWidth="1.8" />;
  if (config.accessory === "necklace") return <><path d="M58 93Q70 109 82 93" fill="none" stroke="#d8aa52" strokeWidth="2" /><circle cx="70" cy="108" r="3" fill="#d8aa52" /></>;
  return null;
}

export function SceneAvatar({ config, name, size = 82, state = "idle", active = false, className = "" }: SceneAvatarProps) {
  const { skin, hair, clothes } = resolveCharacterColors(config);
  return <svg className={`scene-avatar character-avatar ${className}`} style={{ color: clothes }} width={size} height={size} viewBox="0 0 140 182" role="img" aria-label={`${name}'s character`} data-character={name} data-state={state} data-active={active}><ellipse cx="70" cy="179" rx="40" ry="5" fill="rgba(18,14,12,.22)" /><g className="character-rig"><HairBack config={config} color={hair} /><path d="M59 87V101Q70 109 81 101V87Z" fill={skin} stroke={INK} strokeWidth="2.8" /><Body config={config} skin={skin} clothes={clothes} /><Face config={config} skin={skin} state={state} /><HairFront config={config} color={hair} /><Accessory config={config} /><g className="character-state-mark" aria-hidden="true"><circle cx="111" cy="31" r="10" /><path d="M106 31L110 35L117 26" /></g></g></svg>;
}

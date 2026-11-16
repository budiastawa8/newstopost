import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { alignBriefWithSubtitles, scaleBriefToDuration } from "./lib/brief-timing.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return "";
  return process.argv[i + 1] || "";
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function loadBrief(briefPath) {
  const abs = path.resolve(briefPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Brief tidak ditemukan: ${abs}`);
  }
  return { abs, brief: JSON.parse(fs.readFileSync(abs, "utf8")) };
}

async function getAudioDurationSec(filePath) {
  try {
    const mod = await import("music-metadata");
    const meta = await mod.parseFile(filePath);
    return meta.format.duration || 0;
  } catch {
    return 0;
  }
}

const briefArg = argValue("--brief") || path.join(root, "sample-brief.json");
const skipTts = hasFlag("--skip-tts");
const outName = argValue("--out") || "news-motion.mp4";
const { abs: briefAbs, brief: rawBrief } = loadBrief(briefArg);

const publicDir = path.join(root, "public");
const outDir = path.join(root, "out");
fs.mkdirSync(publicDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

const voicePath = path.join(publicDir, "voice.mp3");
const vttPath = path.join(publicDir, "voice.vtt");

if (!skipTts) {
  const tts = spawnSync(
    process.execPath,
    [path.join(root, "scripts", "tts.mjs"), "--brief", briefAbs],
    { encoding: "utf8", shell: true },
  );
  if (tts.status !== 0) {
    console.warn("TTS dilewati (edge-tts belum siap atau gagal). Render tetap jalan tanpa audio.");
    if (tts.stdout) console.warn(tts.stdout.trim());
    if (tts.stderr) console.warn(tts.stderr.trim());
  } else if (tts.stdout) {
    console.log(tts.stdout.trim());
  }
}

let brief = rawBrief;
const audioSrc = fs.existsSync(voicePath) ? "voice.mp3" : null;

if (audioSrc) {
  brief = alignBriefWithSubtitles(brief, vttPath);
  const duration = await getAudioDurationSec(voicePath);
  if (duration > 0.5) {
    const drift = Math.abs(duration - brief.durationSec);
    if (drift > 0.35) {
      brief = scaleBriefToDuration(brief, duration);
    } else {
      brief.durationSec = Number(duration.toFixed(3));
    }
  }
  console.log(`Audio sync → ${brief.durationSec.toFixed(2)}s · beats ${brief.beats.length}`);
}

const props = { brief, audioSrc };
const propsFile = path.join(outDir, "props.json");
fs.writeFileSync(propsFile, `${JSON.stringify(props, null, 2)}\n`);
fs.writeFileSync(
  path.join(outDir, "brief.aligned.json"),
  `${JSON.stringify(brief, null, 2)}\n`,
);

const outFile = path.join(outDir, outName);
const remotionBin = path.join(root, "node_modules", ".bin", "remotion");
const args = [
  "render",
  "src/index.ts",
  "NewsMotion",
  outFile,
  `--props=${propsFile}`,
];

const result = spawnSync(remotionBin, args, {
  cwd: root,
  encoding: "utf8",
  shell: true,
  stdio: "inherit",
});

if (result.status !== 0) {
  process.exit(result.status || 1);
}

console.log(`\nSelesai → ${outFile}`);
if (!audioSrc) {
  console.log("Catatan: tanpa voice.mp3. Install edge-tts lalu jalankan ulang tanpa --skip-tts.");
}

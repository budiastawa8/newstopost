import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function argValue(flag) {
  const i = process.argv.indexOf(flag);
  if (i === -1) return "";
  return process.argv[i + 1] || "";
}

function loadBrief(briefPath) {
  const abs = path.resolve(briefPath);
  if (!fs.existsSync(abs)) {
    throw new Error(`Brief tidak ditemukan: ${abs}`);
  }
  return JSON.parse(fs.readFileSync(abs, "utf8"));
}

/** Windows: `python` sering stub Store. Pakai `py -3` dulu. */
function runEdgeTts(moduleArgs) {
  const attempts = [
    { cmd: "py", args: ["-3", "-m", "edge_tts", ...moduleArgs] },
    { cmd: "py", args: ["-m", "edge_tts", ...moduleArgs] },
    { cmd: "python", args: ["-m", "edge_tts", ...moduleArgs] },
  ];

  const errors = [];
  for (const attempt of attempts) {
    const res = spawnSync(attempt.cmd, attempt.args, {
      encoding: "utf8",
      windowsHide: true,
    });
    if (res.error) {
      errors.push(`${attempt.cmd}: ${res.error.message}`);
      continue;
    }
    if (res.status === 0) return res;
    const detail = `${(res.stderr || "").trim()}\n${(res.stdout || "").trim()}`.trim();
    errors.push(`${attempt.cmd} exit ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  throw new Error(errors.join(" | ") || "edge-tts gagal");
}

function hasEdgeTts() {
  try {
    runEdgeTts(["-h"]);
    return true;
  } catch {
    return false;
  }
}

function synthesizeEdgeTts(text, outMedia, outVtt, voice) {
  runEdgeTts([
    "--voice",
    voice,
    "--text",
    text,
    "--write-media",
    outMedia,
    "--write-subtitles",
    outVtt,
  ]);
}

const briefPath = argValue("--brief") || path.join(root, "sample-brief.json");
const voice = argValue("--voice") || "id-ID-ArdiNeural";
const brief = loadBrief(briefPath);
const publicDir = path.join(root, "public");
fs.mkdirSync(publicDir, { recursive: true });
const outFile = path.join(publicDir, "voice.mp3");
const outVtt = path.join(publicDir, "voice.vtt");

if (!brief.voText || !String(brief.voText).trim()) {
  throw new Error("brief.voText kosong");
}

if (!hasEdgeTts()) {
  console.error("edge-tts belum tersedia.");
  console.error("Install: py -3 -m pip install edge-tts");
  console.error("Lalu jalankan ulang: npm run tts -- --brief=./path/brief.json");
  process.exit(2);
}

synthesizeEdgeTts(String(brief.voText).trim(), outFile, outVtt, voice);
console.log(`TTS OK → ${outFile}`);
console.log(`Subtitles → ${outVtt}`);
console.log(`Voice: ${voice}`);

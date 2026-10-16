// Petit séquenceur Web Audio : une boucle douce (pentatonique) pour le fragment « Lecteur audio ».
let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let timer: number | undefined;
let step = 0;

const NOTES = [261.63, 311.13, 349.23, 392.0, 466.16, 523.25, 466.16, 392.0];

function note(freq: number, at: number, length = 0.9) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.14, at + 0.03);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + length);
  osc.connect(gain);
  gain.connect(master);
  osc.start(at);
  osc.stop(at + length + 0.05);
}

export function playTone() {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    }
    void ctx.resume();
    window.clearInterval(timer);
    step = 0;
    const tick = () => {
      if (!ctx) return;
      const t = ctx.currentTime + 0.02;
      note(NOTES[step % NOTES.length], t);
      if (step % 4 === 0) note(NOTES[0] / 2, t, 1.6);
      step += 1;
    };
    tick();
    timer = window.setInterval(tick, 380);
  } catch {
    /* Audio indisponible */
  }
}

export function stopTone() {
  window.clearInterval(timer);
  timer = undefined;
}

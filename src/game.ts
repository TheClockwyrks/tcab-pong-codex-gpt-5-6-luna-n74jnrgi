import type { Game, InitApi, UpdateApi } from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as K from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
type R = { x: number; y: number; w: number; h: number };
export interface Snapshot {
  readonly version: number;
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { p1: number; p2: number };
  readonly winner: Side | null;
  readonly muted: boolean;
  readonly paddles: { left: PaddleState; right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: (BallState & { speed: number }) | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
}
export interface CaromDebugApi {
  readonly version: number;
  clearWorld(s: DeepReadonly<CaromState>): CaromState;
  spawnBall(s: DeepReadonly<CaromState>): CaromState;
  spawnObstacle(s: DeepReadonly<CaromState>, i: number): CaromState;
  reset(s: DeepReadonly<CaromState>): CaromState;
  reconcile(s: DeepReadonly<CaromState>): CaromState;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    v: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign(s: DeepReadonly<CaromState>): CaromState;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): Snapshot;
  menuItemRect(s: DeepReadonly<CaromState>, i: number): R | null;
}
export const BACKGROUND = "#080b18";
const clamp = (n: number, a: number, b: number) => Math.max(a, Math.min(b, n));
const coin = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const ball = (): BallState => ({
  x: K.FIELD_CX,
  y: K.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: K.HOLD_TIME,
  serveSign: coin(),
  trail: [],
});
const obs = (): ObstacleState[] =>
  K.OBSTACLE_CENTERS.map((p, index) => ({ index, cx: p.x, cy: p.y }));
const initial = (muted = false): CaromState => ({
  screen: "title",
  mode: "solo",
  menuIndex: 0,
  titleIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  paddles: {
    left: { cy: K.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
    right: { cy: K.FIELD_CY, vy: 0, driven: false, drivenVy: 0 },
  },
  ai: { tracking: true, movement: true },
  receiver: "left",
  ball: ball(),
  obstacles: obs(),
  simTime: 0,
  muted,
});
const bclone = (b: DeepReadonly<BallState>): BallState => ({
  ...b,
  trail: b.trail.map((p) => ({ ...p })),
});
const need = (s: DeepReadonly<CaromState>) => {
  if (!s.ball) throw Error("Carom: no ball present");
  return s.ball;
};
const withB = (
  s: DeepReadonly<CaromState>,
  f: (b: BallState) => BallState,
): CaromState => ({ ...s, ball: f(bclone(need(s))) });
const items = (screen: Screen): readonly string[] =>
  screen === "title"
    ? K.TITLE_ITEMS
    : screen === "howto"
      ? ["BACK TO TITLE"]
      : screen === "paused"
        ? K.PAUSE_ITEMS
        : screen === "matchover"
          ? K.MATCHOVER_ITEMS
          : [];
const menuRect = (screen: Screen, i: number): R | null =>
  i < 0 || i >= items(screen).length
    ? null
    : { x: 410, y: 400 + i * 62, w: 460, h: 48 };
const toTitle = (s: DeepReadonly<CaromState>): CaromState => {
  const n = initial(s.muted);
  return {
    ...n,
    titleIndex: s.titleIndex,
    menuIndex: s.titleIndex,
    simTime: s.simTime,
  };
};
const start = (s: DeepReadonly<CaromState>, mode: Mode): CaromState => ({
  ...s,
  screen: "countdown",
  mode,
  menuIndex: 0,
  resumeScreen: "playing",
  score: { p1: 0, p2: 0 },
  winner: null,
  receiver: "left",
  ball: ball(),
  paddles: {
    left: { ...s.paddles.left, cy: K.FIELD_CY, vy: 0 },
    right: { ...s.paddles.right, cy: K.FIELD_CY, vy: 0 },
  },
});
const snap = (s: DeepReadonly<CaromState>): Snapshot => ({
  version: K.CAROM_DEBUG_VERSION,
  screen: s.screen,
  mode: s.mode,
  menuIndex: s.menuIndex,
  titleIndex: s.titleIndex,
  resumeScreen: s.resumeScreen,
  score: { ...s.score },
  winner: s.winner,
  muted: s.muted,
  paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
  ai: { ...s.ai },
  receiver: s.receiver,
  ball: s.ball
    ? {
        ...s.ball,
        speed: Math.hypot(s.ball.vx, s.ball.vy),
        trail: s.ball.trail.map((p) => ({ ...p })),
      }
    : null,
  obstacles: s.obstacles.map((o) => ({ ...o })),
  simTime: s.simTime,
});

function paddles(s: DeepReadonly<CaromState>, api: UpdateApi, dt: number) {
  const mv = (side: Side, v: number): PaddleState => {
    const p = s.paddles[side],
      cy = clamp(p.cy + v * dt, K.PADDLE_MIN_CY, K.PADDLE_MAX_CY);
    return { ...p, cy, vy: dt && cy !== p.cy ? (cy - p.cy) / dt : 0 };
  };
  const human = (u: string, d: string) =>
    (api.input.value(d) - api.input.value(u)) * K.PADDLE_SPEED;
  const lv = s.paddles.left.driven
    ? s.paddles.left.drivenVy
    : human("p1-up", "p1-down");
  let rv = s.paddles.right.driven ? s.paddles.right.drivenVy : 0;
  if (s.mode === "versus")
    rv = s.paddles.right.driven
      ? s.paddles.right.drivenVy
      : human("p2-up", "p2-down");
  else if (!s.paddles.right.driven) {
    const b = s.ball,
      def = s.ai.tracking && s.screen === "playing" && b && b.vx > 0,
      target = def ? b.y - b.vy * K.AI_REACT : K.AI_HOME_Y,
      d = target - s.paddles.right.cy;
    rv =
      s.ai.movement && Math.abs(d) > (def ? K.AI_DEADZONE : K.AI_HOME_DEADZONE)
        ? Math.sign(d) * Math.min(K.AI_SPEED, Math.abs(d) / Math.max(dt, 1e-6))
        : 0;
  }
  return { left: mv("left", lv), right: mv("right", rv) };
}
function hit(
  b: BallState,
  r: { x0: number; y0: number; x1: number; y1: number },
  kind: "left" | "right" | "obstacle",
  p: PaddleState | null,
  a: UpdateApi["audio"],
) {
  const ds = [
    b.x - (r.x0 - K.BALL_R),
    r.x1 + K.BALL_R - b.x,
    b.y - (r.y0 - K.BALL_R),
    r.y1 + K.BALL_R - b.y,
  ];
  if (ds.some((x) => x <= 0)) return b;
  let f = 0;
  for (let i = 1; i < 4; i++) if (ds[i] < ds[f]) f = i;
  const o = { ...b };
  if (f === 0) o.x = r.x0 - K.BALL_R;
  else if (f === 1) o.x = r.x1 + K.BALL_R;
  else if (f === 2) o.y = r.y0 - K.BALL_R;
  else o.y = r.y1 + K.BALL_R;
  if (kind === "left" || kind === "right") {
    if (f < 2) {
      const t =
          clamp((b.y - (p as PaddleState).cy) / K.PADDLE_HALF, -1, 1) *
          K.MAX_BOUNCE_ANGLE,
        sp = Math.min(Math.hypot(b.vx, b.vy) * K.SPEED_MULT, K.SPEED_CAP),
        d = kind === "left" ? 1 : -1;
      o.vx = d * sp * Math.cos(t);
      o.vy = sp * Math.sin(t);
      o.spin = clamp(
        b.spin + (p as PaddleState).vy * K.SPIN_FROM_PADDLE,
        -K.SPIN_CLAMP,
        K.SPIN_CLAMP,
      );
      o.x = kind === "left" ? r.x1 + K.BALL_R : r.x0 - K.BALL_R;
      a.play(K.CUES.paddleHit);
    } else {
      if (f === 2 && o.vy > 0) o.vy = -o.vy;
      if (f === 3 && o.vy < 0) o.vy = -o.vy;
      a.play(K.CUES.wallBounce);
    }
  } else {
    if (f < 2 && ((f === 0 && o.vx > 0) || (f === 1 && o.vx < 0))) o.vx = -o.vx;
    if (f > 1 && ((f === 2 && o.vy > 0) || (f === 3 && o.vy < 0))) o.vy = -o.vy;
    a.play(K.CUES.obstacleBounce);
  }
  return o;
}
function physics(s: CaromState, api: UpdateApi, dt: number): CaromState {
  if (!s.ball) return s;
  let b = bclone(s.ball);
  if (b.held) {
    b = { ...b, holdTimer: b.holdTimer - dt };
    if (b.holdTimer <= 0) {
      const d = s.receiver === "left" ? -1 : 1;
      b = {
        ...b,
        held: false,
        holdTimer: 0,
        vx: d * K.SERVE_SPEED * Math.cos(K.SERVE_ANGLE),
        vy: b.serveSign * K.SERVE_SPEED * Math.sin(K.SERVE_ANGLE),
        trail: [],
      };
    }
    return { ...s, ball: b };
  }
  const n = Math.max(
      1,
      Math.ceil((Math.hypot(b.vx, b.vy) * dt) / K.MAX_SUBSTEP),
    ),
    h = dt / n;
  for (let i = 0; i < n; i++) {
    const sp = Math.hypot(b.vx, b.vy),
      a = sp ? (b.spin / sp) * h : 0,
      c = Math.cos(a),
      d = Math.sin(a);
    b = {
      ...b,
      vx: b.vx * c - b.vy * d,
      vy: b.vx * d + b.vy * c,
      spin: b.spin * Math.pow(0.5, h / K.SPIN_HALFLIFE),
    };
    b = { ...b, x: b.x + b.vx * h, y: b.y + b.vy * h };
    if (b.y - K.BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: K.BALL_R, vy: -b.vy };
      api.audio.play(K.CUES.wallBounce);
    } else if (b.y + K.BALL_R > K.FIELD_H && b.vy > 0) {
      b = { ...b, y: K.FIELD_H - K.BALL_R, vy: -b.vy };
      api.audio.play(K.CUES.wallBounce);
    }
    b = hit(
      b,
      {
        x0: K.P1_X0,
        y0: s.paddles.left.cy - K.PADDLE_HALF,
        x1: K.P1_X1,
        y1: s.paddles.left.cy + K.PADDLE_HALF,
      },
      "left",
      s.paddles.left,
      api.audio,
    );
    b = hit(
      b,
      {
        x0: K.P2_X0,
        y0: s.paddles.right.cy - K.PADDLE_HALF,
        x1: K.P2_X1,
        y1: s.paddles.right.cy + K.PADDLE_HALF,
      },
      "right",
      s.paddles.right,
      api.audio,
    );
    for (const o of s.obstacles)
      b = hit(b, K.OBSTACLES[o.index], "obstacle", null, api.audio);
  }
  return {
    ...s,
    ball: {
      ...b,
      trail: [...b.trail, { x: b.x, y: b.y, t: s.simTime + dt }].filter(
        (p) => p.t >= s.simTime + dt - K.TRAIL_TIME,
      ),
    },
  };
}
function point(s: CaromState, side: Side, api: UpdateApi): CaromState {
  const score = {
    p1: s.score.p1 + (side === "left" ? 1 : 0),
    p2: s.score.p2 + (side === "right" ? 1 : 0),
  };
  api.audio.play(K.CUES.score);
  const win =
    side === "left"
      ? score.p1 >= K.WIN_SCORE && score.p1 - score.p2 >= K.WIN_LEAD
      : score.p2 >= K.WIN_SCORE && score.p2 - score.p1 >= K.WIN_LEAD;
  return win
    ? { ...s, score, winner: side, screen: "matchover", menuIndex: 0 }
    : {
        ...s,
        score,
        receiver: side === "left" ? "right" : "left",
        ball: ball(),
        screen: "countdown",
      };
}
function updateState(
  state: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState {
  let s = { ...state };
  const p = (n: string) => api.input.pressed(n),
    up = p("p1-up") || p("p2-up"),
    down = p("p1-down") || p("p2-down");
  if (["title", "howto", "paused", "matchover"].includes(s.screen)) {
    const its = items(s.screen);
    let i = s.menuIndex;
    if (up) i = (i + its.length - 1) % its.length;
    else if (down) i = (i + 1) % its.length;
    for (const z of api.input.pointerSamples())
      for (let j = 0; j < its.length; j++) {
        const r = menuRect(s.screen, j);
        if (
          r &&
          z.x >= r.x &&
          z.x <= r.x + r.w &&
          z.y >= r.y &&
          z.y <= r.y + r.h
        )
          i = j;
      }
    s = { ...s, menuIndex: i };
    if (p("confirm")) {
      if (s.screen === "title")
        s =
          i === 0
            ? start({ ...s, titleIndex: i }, "solo")
            : i === 1
              ? start({ ...s, titleIndex: i }, "versus")
              : { ...s, titleIndex: i, screen: "howto", menuIndex: 0 };
      else if (s.screen === "howto") s = toTitle(s);
      else if (s.screen === "paused")
        s =
          i === 0
            ? { ...s, screen: s.resumeScreen }
            : i === 1
              ? start(s, s.mode)
              : toTitle(s);
      else s = i === 0 ? start(s, s.mode) : toTitle(s);
    }
    if (
      (s.screen === "howto" && p("back")) ||
      (s.screen === "matchover" && p("back"))
    )
      s = toTitle(s);
    if (s.screen === "paused" && (p("pause") || p("back")))
      s = { ...s, screen: s.resumeScreen };
  } else if ((s.screen === "playing" || s.screen === "countdown") && p("pause"))
    s = { ...s, screen: "paused", resumeScreen: s.screen, menuIndex: 0 };
  if (p("mute")) {
    api.audio.setMuted(!api.audio.muted());
    s = { ...s, muted: api.audio.muted() };
  }
  if (s.screen === "playing" || s.screen === "countdown") {
    s = { ...s, paddles: paddles(s, api, dt) };
    s = physics(s, api, dt);
    if (s.screen === "playing" && s.ball) {
      if (s.ball.x - K.BALL_R > K.FIELD_W) s = point(s, "left", api);
      else if (s.ball.x + K.BALL_R < 0) s = point(s, "right", api);
    }
  }
  return { ...s, simTime: state.simTime + dt };
}

export const BACKGROUND_COLOR = BACKGROUND;
export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>) {
    for (const n of K.ACTIONS)
      api.input.register(n, { keys: [...K.BINDINGS[n]] });
    api.audio.define(K.CUES.paddleHit, {
      wave: "square",
      freq: 280,
      freqTo: 160,
      durationMs: 55,
    });
    api.audio.define(K.CUES.wallBounce, {
      freq: 150,
      freqTo: 90,
      durationMs: 65,
    });
    api.audio.define(K.CUES.obstacleBounce, {
      freq: 400,
      freqTo: 220,
      durationMs: 70,
    });
    api.audio.define(K.CUES.score, {
      wave: "triangle",
      freq: 620,
      freqTo: 900,
      durationMs: 180,
    });
    for (const [n, f] of [
      ["screen", (s: DeepReadonly<CaromState>) => s.screen],
      ["mode", (s: DeepReadonly<CaromState>) => s.mode],
      ["score", (s: DeepReadonly<CaromState>) => `${s.score.p1}-${s.score.p2}`],
      [
        "ball",
        (s: DeepReadonly<CaromState>) =>
          s.ball ? `${s.ball.x.toFixed(0)},${s.ball.y.toFixed(0)}` : "-",
      ],
      [
        "velocity",
        (s: DeepReadonly<CaromState>) =>
          s.ball ? `${s.ball.vx.toFixed(0)},${s.ball.vy.toFixed(0)}` : "-",
      ],
      [
        "speed",
        (s: DeepReadonly<CaromState>) =>
          s.ball ? Math.hypot(s.ball.vx, s.ball.vy) : 0,
      ],
      ["spin", (s: DeepReadonly<CaromState>) => s.ball?.spin ?? 0],
      [
        "paddles",
        (s: DeepReadonly<CaromState>) =>
          `${s.paddles.left.cy.toFixed(0)}/${s.paddles.right.cy.toFixed(0)}`,
      ],
    ] as const)
      api.diagnostics.register(n, f);
    const d: CaromDebugApi = {
      version: K.CAROM_DEBUG_VERSION,
      clearWorld: (s) => ({ ...s, ball: null, obstacles: [] }),
      spawnBall: (s) => ({ ...s, ball: ball() }),
      spawnObstacle: (s, i) => {
        if (i !== 0 && i !== 1) throw Error("Carom: invalid obstacle index");
        return {
          ...s,
          obstacles: [
            ...s.obstacles.filter((o) => o.index !== i),
            {
              index: i,
              cx: K.OBSTACLE_CENTERS[i].x,
              cy: K.OBSTACLE_CENTERS[i].y,
            },
          ].sort((a, b) => a.index - b.index),
        };
      },
      reset: (s) => initial(s.muted),
      reconcile: (s) => ({ ...s }),
      setScreen: (s, v) => ({ ...s, screen: v }),
      setMode: (s, v) => ({ ...s, mode: v }),
      setMenuIndex: (s, v) => ({ ...s, menuIndex: v }),
      setTitleIndex: (s, v) => ({ ...s, titleIndex: v }),
      setResumeScreen: (s, v) => ({ ...s, resumeScreen: v }),
      setScore: (s, p1, p2) => ({ ...s, score: { p1, p2 } }),
      setWinner: (s, v) => ({ ...s, winner: v }),
      setReceiver: (s, v) => ({ ...s, receiver: v }),
      setPaddleCy: (s, x, v) => ({
        ...s,
        paddles: {
          ...s.paddles,
          [x]: {
            ...s.paddles[x],
            cy: clamp(v, K.PADDLE_MIN_CY, K.PADDLE_MAX_CY),
          },
        },
      }),
      setPaddleVy: (s, x, v) => ({
        ...s,
        paddles: { ...s.paddles, [x]: { ...s.paddles[x], drivenVy: v } },
      }),
      setPaddleDriven: (s, x, v) => ({
        ...s,
        paddles: { ...s.paddles, [x]: { ...s.paddles[x], driven: v } },
      }),
      setBallPosition: (s, x, y) => withB(s, (b) => ({ ...b, x, y })),
      setBallVelocity: (s, x, y) => withB(s, (b) => ({ ...b, vx: x, vy: y })),
      setBallSpin: (s, v) => withB(s, (b) => ({ ...b, spin: v })),
      setBallHeld: (s, v) => withB(s, (b) => ({ ...b, held: v })),
      setBallHoldTimer: (s, v) =>
        withB(s, (b) => ({ ...b, holdTimer: v, held: v > 0 })),
      setBallServeSign: (s, v) => withB(s, (b) => ({ ...b, serveSign: v })),
      drawBallServeSign: (s) => withB(s, (b) => ({ ...b, serveSign: coin() })),
      setAiTracking: (s, v) => ({ ...s, ai: { ...s.ai, tracking: v } }),
      setAiMovement: (s, v) => ({ ...s, ai: { ...s.ai, movement: v } }),
      setMuted: (s, v) => ({ ...s, muted: v }),
      snapshot: snap,
      menuItemRect: (s, i) => menuRect(s.screen, i),
    };
    return [initial(false), d];
  },
  update: updateState,
  render(s, api) {
    draw(s, api.ctx);
  },
};
function rr(
  c: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
  c.fill();
}
function draw(s: DeepReadonly<CaromState>, c: CanvasRenderingContext2D) {
  c.fillStyle = BACKGROUND;
  c.fillRect(0, 0, K.FIELD_W, K.FIELD_H);
  c.strokeStyle = "#26304a";
  c.setLineDash([10, 16]);
  c.beginPath();
  c.moveTo(K.NET_X, 0);
  c.lineTo(K.NET_X, K.FIELD_H);
  c.stroke();
  c.setLineDash([]);
  for (const o of s.obstacles) {
    c.fillStyle = "#f2b84b";
    rr(c, o.cx - 10, o.cy - 70, 20, 140, 8);
  }
  for (const [x, p, col] of [
    [K.P1_X0, s.paddles.left, "#55e6c1"],
    [K.P2_X0, s.paddles.right, "#ff6b8a"],
  ] as const) {
    c.fillStyle = col;
    rr(c, x, p.cy - K.PADDLE_H / 2, 16, K.PADDLE_H, 8);
  }
  if (s.ball) {
    c.strokeStyle = "rgba(100,220,255,.35)";
    c.lineWidth = 5;
    c.beginPath();
    s.ball.trail.forEach((p, i) =>
      i ? c.lineTo(p.x, p.y) : c.moveTo(p.x, p.y),
    );
    c.stroke();
    c.fillStyle = "#eaf8ff";
    c.beginPath();
    c.arc(s.ball.x, s.ball.y, K.BALL_R, 0, Math.PI * 2);
    c.fill();
  }
  if (["title", "howto", "paused", "matchover"].includes(s.screen)) {
    c.fillStyle = "rgba(8,11,24,.86)";
    c.fillRect(250, 70, 780, 585);
    c.fillStyle = "#eaf5ff";
    c.textAlign = "center";
    c.font = "900 86px system-ui";
    c.fillText(
      s.screen === "title"
        ? K.TITLE_TEXT
        : s.screen === "howto"
          ? "HOW TO PLAY"
          : s.screen === "paused"
            ? "PAUSED"
            : `${s.winner === "left" ? "PLAYER ONE" : "PLAYER TWO"} WINS`,
      640,
      220,
    );
    if (s.screen === "howto") {
      c.font = "18px system-ui";
      c.fillStyle = "#aab8d8";
      c.fillText("W/S or ↑/↓ move · P pauses · M mutes", 640, 290);
      c.fillText(
        "Move as you strike to add spin. Bank shots off the gold bars.",
        640,
        325,
      );
    }
    items(s.screen).forEach((v, i) => {
      const r = menuRect(s.screen, i)!;
      c.fillStyle = i === s.menuIndex ? "#55e6c1" : "#24304d";
      rr(c, r.x, r.y, r.w, r.h, 10);
      c.fillStyle = i === s.menuIndex ? "#07111b" : "#d9e6ff";
      c.font = "700 18px system-ui";
      c.fillText(v, 640, r.y + 31);
    });
  } else {
    c.fillStyle = "#edf4ff";
    c.font = "700 42px system-ui";
    c.fillText(`${s.score.p1}     ${s.score.p2}`, 640, 78);
    c.font = "600 15px system-ui";
    c.fillStyle = "#8291b7";
    c.fillText(
      s.mode === "solo" ? "SOLO // LIVE RALLY" : "VERSUS // LIVE RALLY",
      640,
      110,
    );
    if (s.screen === "countdown" && s.ball) {
      c.font = "700 24px system-ui";
      c.fillText(
        `SERVE IN ${Math.max(0, s.ball.holdTimer).toFixed(1)}`,
        640,
        650,
      );
    }
  }
}

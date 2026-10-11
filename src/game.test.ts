import { describe, expect, it } from "vitest";
import { game } from "./game";

describe("Carom state surface", () => {
  it("initializes a complete title world and supports immutable poses", async () => {
    const diagnostics: unknown[] = [];
    const api = {
      input: { register() {} },
      audio: { define() {} },
      diagnostics: {
        register(_name: string, _source: unknown) {
          diagnostics.push(_name);
        },
      },
    } as never;
    const [state, debug] = await game.initialize(api);
    expect(debug.snapshot(state).screen).toBe("title");
    expect(debug.snapshot(state).ball?.speed).toBe(0);
    const posed = debug.setBallVelocity(state, 500, 0);
    expect(debug.snapshot(posed).ball?.speed).toBe(500);
    expect(debug.snapshot(state).ball?.speed).toBe(0);
    expect(diagnostics).toContain("screen");
  });
});

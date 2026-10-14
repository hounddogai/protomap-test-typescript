import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingWindowEngine } from "./pacing-window-engine.js";
import { newPacingWindow } from "./pacing-window.js";

test("PacingWindowEngine keeps results within bounds", () => {
  const engine = defaultPacingWindowEngine(flags.newRegistry());
  const item = newPacingWindow("code-400", "title-443");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

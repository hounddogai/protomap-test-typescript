import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowScoreEngine } from "./window-score-engine.js";
import { newWindowScore } from "./window-score.js";

test("WindowScoreEngine keeps results within bounds", () => {
  const engine = defaultWindowScoreEngine(flags.newRegistry());
  const item = newWindowScore("code-209", "label-955");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

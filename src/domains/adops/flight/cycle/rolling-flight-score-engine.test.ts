import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingFlightScoreEngine } from "./rolling-flight-score-engine.js";
import { newRollingFlightScore } from "./rolling-flight-score.js";

test("RollingFlightScoreEngine keeps results within bounds", () => {
  const engine = defaultRollingFlightScoreEngine(flags.newRegistry());
  const item = newRollingFlightScore("code-326", "label-42");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

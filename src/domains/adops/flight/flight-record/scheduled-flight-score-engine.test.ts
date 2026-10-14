import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledFlightScoreEngine } from "./scheduled-flight-score-engine.js";
import { newScheduledFlightScore } from "./scheduled-flight-score.js";

test("ScheduledFlightScoreEngine keeps results within bounds", () => {
  const engine = defaultScheduledFlightScoreEngine(flags.newRegistry());
  const item = newScheduledFlightScore("code-543", "title-373");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

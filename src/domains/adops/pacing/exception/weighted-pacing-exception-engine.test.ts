import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedPacingExceptionEngine } from "./weighted-pacing-exception-engine.js";
import { newWeightedPacingException } from "./weighted-pacing-exception.js";

test("WeightedPacingExceptionEngine keeps results within bounds", () => {
  const engine = defaultWeightedPacingExceptionEngine(flags.newRegistry());
  const item = newWeightedPacingException("code-374", "name-368");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

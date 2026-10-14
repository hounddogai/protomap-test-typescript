import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationBaselineEngine } from "./activation-baseline-engine.js";
import { newActivationBaseline } from "./activation-baseline.js";

test("ActivationBaselineEngine keeps results within bounds", () => {
  const engine = defaultActivationBaselineEngine(flags.newRegistry());
  const item = newActivationBaseline("code-548", "label-315");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

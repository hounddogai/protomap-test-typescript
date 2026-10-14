import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchThresholdEngine } from "./branch-threshold-engine.js";
import { newBranchThreshold } from "./branch-threshold.js";

test("BranchThresholdEngine keeps results within bounds", () => {
  const engine = defaultBranchThresholdEngine(flags.newRegistry());
  const item = newBranchThreshold("code-684", "title-536");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

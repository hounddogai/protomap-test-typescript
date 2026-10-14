import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBranchBaselineEngine } from "./branch-baseline-engine.js";
import { newBranchBaseline } from "./branch-baseline.js";

test("BranchBaselineEngine keeps results within bounds", () => {
  const engine = defaultBranchBaselineEngine(flags.newRegistry());
  const item = newBranchBaseline("code-644", "title-543");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

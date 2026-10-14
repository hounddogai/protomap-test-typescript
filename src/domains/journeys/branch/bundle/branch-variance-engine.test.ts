import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchVarianceEngine } from "./branch-variance-engine.js";
import { newBranchVariance } from "./branch-variance.js";

test("BranchVarianceEngine keeps results within bounds", () => {
  const engine = defaultBranchVarianceEngine();
  const item = newBranchVariance("code-861", "label-477");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

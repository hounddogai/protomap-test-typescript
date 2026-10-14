import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictApprovalRollupEngine } from "./strict-approval-rollup-engine.js";
import { newStrictApprovalRollup } from "./strict-approval-rollup.js";

test("StrictApprovalRollupEngine keeps results within bounds", () => {
  const engine = defaultStrictApprovalRollupEngine();
  const item = newStrictApprovalRollup("code-694", "title-563");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

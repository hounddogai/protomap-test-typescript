import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalBaselineEngine } from "./approval-baseline-engine.js";
import { newApprovalBaseline } from "./approval-baseline.js";

test("ApprovalBaselineEngine keeps results within bounds", () => {
  const engine = defaultApprovalBaselineEngine();
  const item = newApprovalBaseline("code-678", "name-95");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

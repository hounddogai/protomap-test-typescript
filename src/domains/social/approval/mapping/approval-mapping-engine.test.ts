import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalMappingEngine } from "./approval-mapping-engine.js";
import { newApprovalMapping } from "./approval-mapping.js";

test("ApprovalMappingEngine keeps results within bounds", () => {
  const engine = defaultApprovalMappingEngine();
  const item = newApprovalMapping("code-446", "label-888");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

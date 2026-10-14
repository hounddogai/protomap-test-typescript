import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalSegmentEngine } from "./approval-segment-engine.js";
import { newApprovalSegment } from "./approval-segment.js";

test("ApprovalSegmentEngine keeps results within bounds", () => {
  const engine = defaultApprovalSegmentEngine();
  const item = newApprovalSegment("code-203", "name-288");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultApprovalAdjustmentEngine } from "./approval-adjustment-engine.js";
import { newApprovalAdjustment } from "./approval-adjustment.js";

test("ApprovalAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultApprovalAdjustmentEngine(flags.newRegistry());
  const item = newApprovalAdjustment("code-730", "title-339");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

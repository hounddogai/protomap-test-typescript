import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalApprovalAdjustmentEngine } from "./seasonal-approval-adjustment-engine.js";
import { newSeasonalApprovalAdjustment } from "./seasonal-approval-adjustment.js";

test("SeasonalApprovalAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultSeasonalApprovalAdjustmentEngine(flags.newRegistry());
  const item = newSeasonalApprovalAdjustment("code-779", "name-514");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledReputationAdjustmentEngine } from "./scheduled-reputation-adjustment-engine.js";
import { newScheduledReputationAdjustment } from "./scheduled-reputation-adjustment.js";

test("ScheduledReputationAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultScheduledReputationAdjustmentEngine(flags.newRegistry());
  const item = newScheduledReputationAdjustment("code-829", "title-679");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

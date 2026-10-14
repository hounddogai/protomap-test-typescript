import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgeAdjustmentEngine } from "./badge-adjustment-engine.js";
import { newBadgeAdjustment } from "./badge-adjustment.js";

test("BadgeAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultBadgeAdjustmentEngine();
  const item = newBadgeAdjustment("code-563", "title-705");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

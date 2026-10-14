import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBadgeThresholdEngine } from "./badge-threshold-engine.js";
import { newBadgeThreshold } from "./badge-threshold.js";

test("BadgeThresholdEngine keeps results within bounds", () => {
  const engine = defaultBadgeThresholdEngine();
  const item = newBadgeThreshold("code-205", "label-349");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

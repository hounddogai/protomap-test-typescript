import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalBadgeBaselineEngine } from "./seasonal-badge-baseline-engine.js";
import { newSeasonalBadgeBaseline } from "./seasonal-badge-baseline.js";

test("SeasonalBadgeBaselineEngine keeps results within bounds", () => {
  const engine = defaultSeasonalBadgeBaselineEngine();
  const item = newSeasonalBadgeBaseline("code-968", "title-315");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

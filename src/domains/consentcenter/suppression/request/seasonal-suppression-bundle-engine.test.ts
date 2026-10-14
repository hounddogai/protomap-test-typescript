import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalSuppressionBundleEngine } from "./seasonal-suppression-bundle-engine.js";
import { newSeasonalSuppressionBundle } from "./seasonal-suppression-bundle.js";

test("SeasonalSuppressionBundleEngine keeps results within bounds", () => {
  const engine = defaultSeasonalSuppressionBundleEngine();
  const item = newSeasonalSuppressionBundle("code-946", "label-48");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

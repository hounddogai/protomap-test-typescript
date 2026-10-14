import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalExitRuleManifestEngine } from "./seasonal-exit-rule-manifest-engine.js";
import { newSeasonalExitRuleManifest } from "./seasonal-exit-rule-manifest.js";

test("SeasonalExitRuleManifestEngine keeps results within bounds", () => {
  const engine = defaultSeasonalExitRuleManifestEngine();
  const item = newSeasonalExitRuleManifest("code-129", "title-381");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

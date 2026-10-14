import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryRewardRuleManifestEngine } from "./primary-reward-rule-manifest-engine.js";
import { newPrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

test("PrimaryRewardRuleManifestEngine keeps results within bounds", () => {
  const engine = defaultPrimaryRewardRuleManifestEngine();
  const item = newPrimaryRewardRuleManifest("code-196", "name-732");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

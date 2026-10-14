import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryTierRollupEngine } from "./primary-tier-rollup-engine.js";
import { newPrimaryTierRollup } from "./primary-tier-rollup.js";

test("PrimaryTierRollupEngine keeps results within bounds", () => {
  const engine = defaultPrimaryTierRollupEngine();
  const item = newPrimaryTierRollup("code-571", "label-527");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingTierRollupEngine } from "./rolling-tier-rollup-engine.js";
import { newRollingTierRollup } from "./rolling-tier-rollup.js";

test("RollingTierRollupEngine keeps results within bounds", () => {
  const engine = defaultRollingTierRollupEngine();
  const item = newRollingTierRollup("code-447", "label-389");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyDoubleOptInRollupEngine } from "./legacy-double-opt-in-rollup-engine.js";
import { newLegacyDoubleOptInRollup } from "./legacy-double-opt-in-rollup.js";

test("LegacyDoubleOptInRollupEngine keeps results within bounds", () => {
  const engine = defaultLegacyDoubleOptInRollupEngine();
  const item = newLegacyDoubleOptInRollup("code-120", "name-664");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyPacingRollupEngine } from "./legacy-pacing-rollup-engine.js";
import { newLegacyPacingRollup } from "./legacy-pacing-rollup.js";

test("LegacyPacingRollupEngine keeps results within bounds", () => {
  const engine = defaultLegacyPacingRollupEngine();
  const item = newLegacyPacingRollup("code-326", "label-531");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

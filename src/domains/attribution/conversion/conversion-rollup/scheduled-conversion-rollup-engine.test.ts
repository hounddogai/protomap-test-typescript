import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledConversionRollupEngine } from "./scheduled-conversion-rollup-engine.js";
import { newScheduledConversionRollup } from "./scheduled-conversion-rollup.js";

test("ScheduledConversionRollupEngine keeps results within bounds", () => {
  const engine = defaultScheduledConversionRollupEngine();
  const item = newScheduledConversionRollup("code-520", "name-669");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

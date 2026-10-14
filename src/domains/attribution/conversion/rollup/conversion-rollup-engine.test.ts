import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionRollupEngine } from "./conversion-rollup-engine.js";
import { newConversionRollup } from "./conversion-rollup.js";

test("ConversionRollupEngine keeps results within bounds", () => {
  const engine = defaultConversionRollupEngine();
  const item = newConversionRollup("code-242", "label-980");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

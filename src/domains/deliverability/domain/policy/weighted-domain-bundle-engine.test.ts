import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedDomainBundleEngine } from "./weighted-domain-bundle-engine.js";
import { newWeightedDomainBundle } from "./weighted-domain-bundle.js";

test("WeightedDomainBundleEngine keeps results within bounds", () => {
  const engine = defaultWeightedDomainBundleEngine();
  const item = newWeightedDomainBundle("code-673", "title-704");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

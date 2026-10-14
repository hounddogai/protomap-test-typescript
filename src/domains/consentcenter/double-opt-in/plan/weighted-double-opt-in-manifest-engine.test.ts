import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWeightedDoubleOptInManifestEngine } from "./weighted-double-opt-in-manifest-engine.js";
import { newWeightedDoubleOptInManifest } from "./weighted-double-opt-in-manifest.js";

test("WeightedDoubleOptInManifestEngine keeps results within bounds", () => {
  const engine = defaultWeightedDoubleOptInManifestEngine();
  const item = newWeightedDoubleOptInManifest("code-386", "label-502");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

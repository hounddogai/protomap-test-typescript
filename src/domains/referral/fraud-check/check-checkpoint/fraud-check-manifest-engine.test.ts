import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFraudCheckManifestEngine } from "./fraud-check-manifest-engine.js";
import { newFraudCheckManifest } from "./fraud-check-manifest.js";

test("FraudCheckManifestEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckManifestEngine();
  const item = newFraudCheckManifest("code-610", "label-776");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

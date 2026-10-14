import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRedemptionManifestEngine } from "./redemption-manifest-engine.js";
import { newRedemptionManifest } from "./redemption-manifest.js";

test("RedemptionManifestEngine keeps results within bounds", () => {
  const engine = defaultRedemptionManifestEngine();
  const item = newRedemptionManifest("code-445", "title-368");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

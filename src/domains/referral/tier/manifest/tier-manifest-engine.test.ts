import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierManifestEngine } from "./tier-manifest-engine.js";
import { newTierManifest } from "./tier-manifest.js";

test("TierManifestEngine keeps results within bounds", () => {
  const engine = defaultTierManifestEngine();
  const item = newTierManifest("code-861", "name-430");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

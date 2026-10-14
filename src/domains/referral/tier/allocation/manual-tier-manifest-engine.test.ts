import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualTierManifestEngine } from "./manual-tier-manifest-engine.js";
import { newManualTierManifest } from "./manual-tier-manifest.js";

test("ManualTierManifestEngine keeps results within bounds", () => {
  const engine = defaultManualTierManifestEngine();
  const item = newManualTierManifest("code-436", "label-103");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

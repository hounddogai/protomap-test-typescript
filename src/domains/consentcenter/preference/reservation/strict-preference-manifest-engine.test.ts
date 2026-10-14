import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictPreferenceManifestEngine } from "./strict-preference-manifest-engine.js";
import { newStrictPreferenceManifest } from "./strict-preference-manifest.js";

test("StrictPreferenceManifestEngine keeps results within bounds", () => {
  const engine = defaultStrictPreferenceManifestEngine();
  const item = newStrictPreferenceManifest("code-247", "title-410");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

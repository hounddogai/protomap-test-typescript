import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyBadgeManifestEngine } from "./legacy-badge-manifest-engine.js";
import { newLegacyBadgeManifest } from "./legacy-badge-manifest.js";

test("LegacyBadgeManifestEngine keeps results within bounds", () => {
  const engine = defaultLegacyBadgeManifestEngine();
  const item = newLegacyBadgeManifest("code-117", "title-224");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

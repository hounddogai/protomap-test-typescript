import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalBadgeManifestEngine } from "./regional-badge-manifest-engine.js";
import { newRegionalBadgeManifest } from "./regional-badge-manifest.js";

test("RegionalBadgeManifestEngine keeps results within bounds", () => {
  const engine = defaultRegionalBadgeManifestEngine();
  const item = newRegionalBadgeManifest("code-28", "name-971");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

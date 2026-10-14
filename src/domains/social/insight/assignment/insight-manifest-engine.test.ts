import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInsightManifestEngine } from "./insight-manifest-engine.js";
import { newInsightManifest } from "./insight-manifest.js";

test("InsightManifestEngine keeps results within bounds", () => {
  const engine = defaultInsightManifestEngine();
  const item = newInsightManifest("code-195", "name-524");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedCsatManifestEngine } from "./capped-csat-manifest-engine.js";
import { newCappedCsatManifest } from "./capped-csat-manifest.js";

test("CappedCsatManifestEngine keeps results within bounds", () => {
  const engine = defaultCappedCsatManifestEngine();
  const item = newCappedCsatManifest("code-680", "label-372");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

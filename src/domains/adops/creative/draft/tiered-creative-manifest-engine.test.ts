import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredCreativeManifestEngine } from "./tiered-creative-manifest-engine.js";
import { newTieredCreativeManifest } from "./tiered-creative-manifest.js";

test("TieredCreativeManifestEngine keeps results within bounds", () => {
  const engine = defaultTieredCreativeManifestEngine(flags.newRegistry());
  const item = newTieredCreativeManifest("code-783", "title-336");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

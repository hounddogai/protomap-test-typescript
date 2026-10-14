import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredSuppressionManifestEngine } from "./tiered-suppression-manifest-engine.js";
import { newTieredSuppressionManifest } from "./tiered-suppression-manifest.js";

test("TieredSuppressionManifestEngine keeps results within bounds", () => {
  const engine = defaultTieredSuppressionManifestEngine(flags.newRegistry());
  const item = newTieredSuppressionManifest("code-629", "title-428");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

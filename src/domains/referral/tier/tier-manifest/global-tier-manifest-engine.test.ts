import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalTierManifestEngine } from "./global-tier-manifest-engine.js";
import { newGlobalTierManifest } from "./global-tier-manifest.js";

test("GlobalTierManifestEngine keeps results within bounds", () => {
  const engine = defaultGlobalTierManifestEngine(flags.newRegistry());
  const item = newGlobalTierManifest("code-25", "name-707");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

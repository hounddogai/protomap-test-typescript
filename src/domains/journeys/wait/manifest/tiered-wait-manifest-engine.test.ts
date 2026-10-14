import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredWaitManifestEngine } from "./tiered-wait-manifest-engine.js";
import { newTieredWaitManifest } from "./tiered-wait-manifest.js";

test("TieredWaitManifestEngine keeps results within bounds", () => {
  const engine = defaultTieredWaitManifestEngine(flags.newRegistry());
  const item = newTieredWaitManifest("code-447", "label-394");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

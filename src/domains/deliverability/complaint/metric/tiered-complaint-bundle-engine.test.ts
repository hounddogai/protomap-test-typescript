import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredComplaintBundleEngine } from "./tiered-complaint-bundle-engine.js";
import { newTieredComplaintBundle } from "./tiered-complaint-bundle.js";

test("TieredComplaintBundleEngine keeps results within bounds", () => {
  const engine = defaultTieredComplaintBundleEngine(flags.newRegistry());
  const item = newTieredComplaintBundle("code-669", "name-885");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

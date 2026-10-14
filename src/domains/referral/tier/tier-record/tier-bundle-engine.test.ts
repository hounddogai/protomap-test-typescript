import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierBundleEngine } from "./tier-bundle-engine.js";
import { newTierBundle } from "./tier-bundle.js";

test("TierBundleEngine keeps results within bounds", () => {
  const engine = defaultTierBundleEngine(flags.newRegistry());
  const item = newTierBundle("code-847", "name-25");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

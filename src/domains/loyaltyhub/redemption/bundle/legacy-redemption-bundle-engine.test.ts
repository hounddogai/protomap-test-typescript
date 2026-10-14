import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyRedemptionBundleEngine } from "./legacy-redemption-bundle-engine.js";
import { newLegacyRedemptionBundle } from "./legacy-redemption-bundle.js";

test("LegacyRedemptionBundleEngine keeps results within bounds", () => {
  const engine = defaultLegacyRedemptionBundleEngine(flags.newRegistry());
  const item = newLegacyRedemptionBundle("code-400", "label-191");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

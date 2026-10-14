import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalRedemptionBundleEngine } from "./global-redemption-bundle-engine.js";
import { newGlobalRedemptionBundle } from "./global-redemption-bundle.js";

test("GlobalRedemptionBundleEngine keeps results within bounds", () => {
  const engine = defaultGlobalRedemptionBundleEngine(flags.newRegistry());
  const item = newGlobalRedemptionBundle("code-445", "label-547");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

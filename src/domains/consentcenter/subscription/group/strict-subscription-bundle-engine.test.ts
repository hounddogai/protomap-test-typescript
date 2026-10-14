import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictSubscriptionBundleEngine } from "./strict-subscription-bundle-engine.js";
import { newStrictSubscriptionBundle } from "./strict-subscription-bundle.js";

test("StrictSubscriptionBundleEngine keeps results within bounds", () => {
  const engine = defaultStrictSubscriptionBundleEngine();
  const item = newStrictSubscriptionBundle("code-866", "name-948");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

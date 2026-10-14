import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionBundleEngine } from "./subscription-bundle-engine.js";
import { newSubscriptionBundle } from "./subscription-bundle.js";

test("SubscriptionBundleEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionBundleEngine();
  const item = newSubscriptionBundle("code-906", "label-465");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

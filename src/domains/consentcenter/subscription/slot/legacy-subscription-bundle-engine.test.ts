import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacySubscriptionBundleEngine } from "./legacy-subscription-bundle-engine.js";
import { newLegacySubscriptionBundle } from "./legacy-subscription-bundle.js";

test("LegacySubscriptionBundleEngine keeps results within bounds", () => {
  const engine = defaultLegacySubscriptionBundleEngine();
  const item = newLegacySubscriptionBundle("code-456", "title-496");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

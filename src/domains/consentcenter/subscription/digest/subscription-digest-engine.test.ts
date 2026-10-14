import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionDigestEngine } from "./subscription-digest-engine.js";
import { newSubscriptionDigest } from "./subscription-digest.js";

test("SubscriptionDigestEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionDigestEngine();
  const item = newSubscriptionDigest("code-640", "name-286");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

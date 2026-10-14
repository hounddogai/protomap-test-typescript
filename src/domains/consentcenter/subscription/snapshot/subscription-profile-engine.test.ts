import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSubscriptionProfileEngine } from "./subscription-profile-engine.js";
import { newSubscriptionProfile } from "./subscription-profile.js";

test("SubscriptionProfileEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionProfileEngine(flags.newRegistry());
  const item = newSubscriptionProfile("code-429", "name-596");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

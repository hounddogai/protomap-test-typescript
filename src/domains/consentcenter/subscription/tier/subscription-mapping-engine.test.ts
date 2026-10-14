import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionMappingEngine } from "./subscription-mapping-engine.js";
import { newSubscriptionMapping } from "./subscription-mapping.js";

test("SubscriptionMappingEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionMappingEngine();
  const item = newSubscriptionMapping("code-993", "title-412");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

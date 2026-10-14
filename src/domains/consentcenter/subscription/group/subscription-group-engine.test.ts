import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionGroupEngine } from "./subscription-group-engine.js";
import { newSubscriptionGroup } from "./subscription-group.js";

test("SubscriptionGroupEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionGroupEngine();
  const item = newSubscriptionGroup("code-196", "title-471");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

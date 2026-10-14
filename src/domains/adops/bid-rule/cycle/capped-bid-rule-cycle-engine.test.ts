import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedBidRuleCycleEngine } from "./capped-bid-rule-cycle-engine.js";
import { newCappedBidRuleCycle } from "./capped-bid-rule-cycle.js";

test("CappedBidRuleCycleEngine keeps results within bounds", () => {
  const engine = defaultCappedBidRuleCycleEngine();
  const item = newCappedBidRuleCycle("code-586", "name-650");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

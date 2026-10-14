import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleCycleEngine } from "./bid-rule-cycle-engine.js";
import { newBidRuleCycle } from "./bid-rule-cycle.js";

test("BidRuleCycleEngine keeps results within bounds", () => {
  const engine = defaultBidRuleCycleEngine(flags.newRegistry());
  const item = newBidRuleCycle("code-980", "label-495");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

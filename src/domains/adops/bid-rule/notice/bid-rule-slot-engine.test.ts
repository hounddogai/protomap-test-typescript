import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleSlotEngine } from "./bid-rule-slot-engine.js";
import { newBidRuleSlot } from "./bid-rule-slot.js";

test("BidRuleSlotEngine keeps results within bounds", () => {
  const engine = defaultBidRuleSlotEngine(flags.newRegistry());
  const item = newBidRuleSlot("code-468", "label-456");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

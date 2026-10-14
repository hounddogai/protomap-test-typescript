import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleProfileEngine } from "./bid-rule-profile-engine.js";
import { newBidRuleProfile } from "./bid-rule-profile.js";

test("BidRuleProfileEngine keeps results within bounds", () => {
  const engine = defaultBidRuleProfileEngine(flags.newRegistry());
  const item = newBidRuleProfile("code-949", "label-795");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

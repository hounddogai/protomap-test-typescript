import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualBidRuleTierEngine } from "./manual-bid-rule-tier-engine.js";
import { newManualBidRuleTier } from "./manual-bid-rule-tier.js";

test("ManualBidRuleTierEngine keeps results within bounds", () => {
  const engine = defaultManualBidRuleTierEngine(flags.newRegistry());
  const item = newManualBidRuleTier("code-375", "name-527");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

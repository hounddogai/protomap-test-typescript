import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleMappingEngine } from "./bid-rule-mapping-engine.js";
import { newBidRuleMapping } from "./bid-rule-mapping.js";

test("BidRuleMappingEngine keeps results within bounds", () => {
  const engine = defaultBidRuleMappingEngine(flags.newRegistry());
  const item = newBidRuleMapping("code-93", "title-692");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

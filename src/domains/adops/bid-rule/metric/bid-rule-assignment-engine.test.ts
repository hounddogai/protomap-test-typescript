import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBidRuleAssignmentEngine } from "./bid-rule-assignment-engine.js";
import { newBidRuleAssignment } from "./bid-rule-assignment.js";

test("BidRuleAssignmentEngine keeps results within bounds", () => {
  const engine = defaultBidRuleAssignmentEngine(flags.newRegistry());
  const item = newBidRuleAssignment("code-795", "title-674");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

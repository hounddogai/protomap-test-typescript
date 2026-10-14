import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultApprovalTierEngine } from "./approval-tier-engine.js";
import { newApprovalTier } from "./approval-tier.js";

test("ApprovalTierEngine keeps results within bounds", () => {
  const engine = defaultApprovalTierEngine(flags.newRegistry());
  const item = newApprovalTier("code-509", "title-428");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

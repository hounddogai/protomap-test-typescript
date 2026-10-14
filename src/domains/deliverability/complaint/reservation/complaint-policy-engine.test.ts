import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintPolicyEngine } from "./complaint-policy-engine.js";
import { newComplaintPolicy } from "./complaint-policy.js";

test("ComplaintPolicyEngine keeps results within bounds", () => {
  const engine = defaultComplaintPolicyEngine();
  const item = newComplaintPolicy("code-554", "title-877");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

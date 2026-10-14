import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultApprovalAgreementEngine } from "./approval-agreement-engine.js";
import { newApprovalAgreement } from "./approval-agreement.js";

test("ApprovalAgreementEngine keeps results within bounds", () => {
  const engine = defaultApprovalAgreementEngine(flags.newRegistry());
  const item = newApprovalAgreement("code-551", "name-347");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

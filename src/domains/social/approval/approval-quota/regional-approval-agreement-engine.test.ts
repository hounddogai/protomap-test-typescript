import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalApprovalAgreementEngine } from "./regional-approval-agreement-engine.js";
import { newRegionalApprovalAgreement } from "./regional-approval-agreement.js";

test("RegionalApprovalAgreementEngine keeps results within bounds", () => {
  const engine = defaultRegionalApprovalAgreementEngine(flags.newRegistry());
  const item = newRegionalApprovalAgreement("code-901", "label-930");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

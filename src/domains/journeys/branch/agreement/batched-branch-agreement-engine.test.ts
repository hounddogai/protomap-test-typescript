import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedBranchAgreementEngine } from "./batched-branch-agreement-engine.js";
import { newBatchedBranchAgreement } from "./batched-branch-agreement.js";

test("BatchedBranchAgreementEngine keeps results within bounds", () => {
  const engine = defaultBatchedBranchAgreementEngine(flags.newRegistry());
  const item = newBatchedBranchAgreement("code-39", "title-268");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

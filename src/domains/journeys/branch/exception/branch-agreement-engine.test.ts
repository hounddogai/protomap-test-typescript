import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBranchAgreementEngine } from "./branch-agreement-engine.js";
import { newBranchAgreement } from "./branch-agreement.js";

test("BranchAgreementEngine keeps results within bounds", () => {
  const engine = defaultBranchAgreementEngine();
  const item = newBranchAgreement("code-612", "title-740");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

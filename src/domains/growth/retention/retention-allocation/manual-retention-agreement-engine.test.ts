import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualRetentionAgreementEngine } from "./manual-retention-agreement-engine.js";
import { newManualRetentionAgreement } from "./manual-retention-agreement.js";

test("ManualRetentionAgreementEngine keeps results within bounds", () => {
  const engine = defaultManualRetentionAgreementEngine();
  const item = newManualRetentionAgreement("code-894", "name-806");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

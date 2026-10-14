import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledSenderAgreementEngine } from "./scheduled-sender-agreement-engine.js";
import { newScheduledSenderAgreement } from "./scheduled-sender-agreement.js";

test("ScheduledSenderAgreementEngine keeps results within bounds", () => {
  const engine = defaultScheduledSenderAgreementEngine();
  const item = newScheduledSenderAgreement("code-748", "label-590");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

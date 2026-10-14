import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionAgreementEngine } from "./retention-agreement-engine.js";
import { newRetentionAgreement } from "./retention-agreement.js";

test("RetentionAgreementEngine keeps results within bounds", () => {
  const engine = defaultRetentionAgreementEngine(flags.newRegistry());
  const item = newRetentionAgreement("code-281", "label-678");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

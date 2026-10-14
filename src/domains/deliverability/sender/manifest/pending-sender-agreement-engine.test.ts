import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingSenderAgreementEngine } from "./pending-sender-agreement-engine.js";
import { newPendingSenderAgreement } from "./pending-sender-agreement.js";

test("PendingSenderAgreementEngine keeps results within bounds", () => {
  const engine = defaultPendingSenderAgreementEngine(flags.newRegistry());
  const item = newPendingSenderAgreement("code-650", "label-915");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledMacroAgreementEngine } from "./scheduled-macro-agreement-engine.js";
import { newScheduledMacroAgreement } from "./scheduled-macro-agreement.js";

test("ScheduledMacroAgreementEngine keeps results within bounds", () => {
  const engine = defaultScheduledMacroAgreementEngine(flags.newRegistry());
  const item = newScheduledMacroAgreement("code-536", "label-347");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

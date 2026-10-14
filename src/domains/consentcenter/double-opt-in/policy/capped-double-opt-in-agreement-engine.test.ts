import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedDoubleOptInAgreementEngine } from "./capped-double-opt-in-agreement-engine.js";
import { newCappedDoubleOptInAgreement } from "./capped-double-opt-in-agreement.js";

test("CappedDoubleOptInAgreementEngine keeps results within bounds", () => {
  const engine = defaultCappedDoubleOptInAgreementEngine(flags.newRegistry());
  const item = newCappedDoubleOptInAgreement("code-109", "title-70");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

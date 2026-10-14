import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalSlaAgreementEngine } from "./regional-sla-agreement-engine.js";
import { newRegionalSlaAgreement } from "./regional-sla-agreement.js";

test("RegionalSlaAgreementEngine keeps results within bounds", () => {
  const engine = defaultRegionalSlaAgreementEngine(flags.newRegistry());
  const item = newRegionalSlaAgreement("code-802", "title-545");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

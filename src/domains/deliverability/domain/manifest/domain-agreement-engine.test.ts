import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDomainAgreementEngine } from "./domain-agreement-engine.js";
import { newDomainAgreement } from "./domain-agreement.js";

test("DomainAgreementEngine keeps results within bounds", () => {
  const engine = defaultDomainAgreementEngine(flags.newRegistry());
  const item = newDomainAgreement("code-246", "name-340");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

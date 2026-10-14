import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingProofAgreementEngine } from "./pending-proof-agreement-engine.js";
import { newPendingProofAgreement } from "./pending-proof-agreement.js";

test("PendingProofAgreementEngine keeps results within bounds", () => {
  const engine = defaultPendingProofAgreementEngine(flags.newRegistry());
  const item = newPendingProofAgreement("code-565", "name-400");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

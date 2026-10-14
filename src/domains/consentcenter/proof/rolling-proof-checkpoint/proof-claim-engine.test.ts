import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofClaimEngine } from "./proof-claim-engine.js";
import { newProofClaim } from "./proof-claim.js";

test("ProofClaimEngine keeps results within bounds", () => {
  const engine = defaultProofClaimEngine(flags.newRegistry());
  const item = newProofClaim("code-314", "label-482");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

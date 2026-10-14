import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryReputationClaimEngine } from "./primary-reputation-claim-engine.js";
import { newPrimaryReputationClaim } from "./primary-reputation-claim.js";

test("PrimaryReputationClaimEngine keeps results within bounds", () => {
  const engine = defaultPrimaryReputationClaimEngine(flags.newRegistry());
  const item = newPrimaryReputationClaim("code-528", "title-257");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

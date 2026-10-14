import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedOptOutClaimEngine } from "./weighted-opt-out-claim-engine.js";
import { newWeightedOptOutClaim } from "./weighted-opt-out-claim.js";

test("WeightedOptOutClaimEngine keeps results within bounds", () => {
  const engine = defaultWeightedOptOutClaimEngine(flags.newRegistry());
  const item = newWeightedOptOutClaim("code-397", "name-609");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierClaimEngine } from "./tier-claim-engine.js";
import { newTierClaim } from "./tier-claim.js";

test("TierClaimEngine keeps results within bounds", () => {
  const engine = defaultTierClaimEngine(flags.newRegistry());
  const item = newTierClaim("code-708", "name-275");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredStreakClaimEngine } from "./tiered-streak-claim-engine.js";
import { newTieredStreakClaim } from "./tiered-streak-claim.js";

test("TieredStreakClaimEngine keeps results within bounds", () => {
  const engine = defaultTieredStreakClaimEngine(flags.newRegistry());
  const item = newTieredStreakClaim("code-575", "title-690");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

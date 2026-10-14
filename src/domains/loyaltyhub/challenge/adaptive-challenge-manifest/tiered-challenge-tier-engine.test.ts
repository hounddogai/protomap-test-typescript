import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredChallengeTierEngine } from "./tiered-challenge-tier-engine.js";
import { newTieredChallengeTier } from "./tiered-challenge-tier.js";

test("TieredChallengeTierEngine keeps results within bounds", () => {
  const engine = defaultTieredChallengeTierEngine(flags.newRegistry());
  const item = newTieredChallengeTier("code-791", "name-634");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

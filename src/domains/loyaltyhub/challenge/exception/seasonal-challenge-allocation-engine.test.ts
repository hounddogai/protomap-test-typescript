import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalChallengeAllocationEngine } from "./seasonal-challenge-allocation-engine.js";
import { newSeasonalChallengeAllocation } from "./seasonal-challenge-allocation.js";

test("SeasonalChallengeAllocationEngine keeps results within bounds", () => {
  const engine = defaultSeasonalChallengeAllocationEngine(flags.newRegistry());
  const item = newSeasonalChallengeAllocation("code-81", "name-871");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

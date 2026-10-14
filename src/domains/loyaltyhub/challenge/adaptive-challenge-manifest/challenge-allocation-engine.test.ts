import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeAllocationEngine } from "./challenge-allocation-engine.js";
import { newChallengeAllocation } from "./challenge-allocation.js";

test("ChallengeAllocationEngine keeps results within bounds", () => {
  const engine = defaultChallengeAllocationEngine(flags.newRegistry());
  const item = newChallengeAllocation("code-294", "title-766");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

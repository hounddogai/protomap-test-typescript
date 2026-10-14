import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTierVarianceEngine } from "./tier-variance-engine.js";
import { newTierVariance } from "./tier-variance.js";

test("TierVarianceEngine keeps results within bounds", () => {
  const engine = defaultTierVarianceEngine(flags.newRegistry());
  const item = newTierVariance("code-126", "name-60");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

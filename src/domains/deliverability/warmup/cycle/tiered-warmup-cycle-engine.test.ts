import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredWarmupCycleEngine } from "./tiered-warmup-cycle-engine.js";
import { newTieredWarmupCycle } from "./tiered-warmup-cycle.js";

test("TieredWarmupCycleEngine keeps results within bounds", () => {
  const engine = defaultTieredWarmupCycleEngine(flags.newRegistry());
  const item = newTieredWarmupCycle("code-30", "label-588");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

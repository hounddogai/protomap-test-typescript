import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredTierCycleEngine } from "./tiered-tier-cycle-engine.js";
import { newTieredTierCycle } from "./tiered-tier-cycle.js";

test("TieredTierCycleEngine keeps results within bounds", () => {
  const engine = defaultTieredTierCycleEngine(flags.newRegistry());
  const item = newTieredTierCycle("code-861", "label-392");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

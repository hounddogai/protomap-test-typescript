import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredOptOutCycleEngine } from "./tiered-opt-out-cycle-engine.js";
import { newTieredOptOutCycle } from "./tiered-opt-out-cycle.js";

test("TieredOptOutCycleEngine keeps results within bounds", () => {
  const engine = defaultTieredOptOutCycleEngine(flags.newRegistry());
  const item = newTieredOptOutCycle("code-691", "label-158");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

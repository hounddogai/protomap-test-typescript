import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualTierCycleEngine } from "./manual-tier-cycle-engine.js";
import { newManualTierCycle } from "./manual-tier-cycle.js";

test("ManualTierCycleEngine keeps results within bounds", () => {
  const engine = defaultManualTierCycleEngine(flags.newRegistry());
  const item = newManualTierCycle("code-449", "name-62");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

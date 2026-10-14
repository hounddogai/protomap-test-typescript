import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationCycleEngine } from "./reputation-cycle-engine.js";
import { newReputationCycle } from "./reputation-cycle.js";

test("ReputationCycleEngine keeps results within bounds", () => {
  const engine = defaultReputationCycleEngine(flags.newRegistry());
  const item = newReputationCycle("code-37", "title-724");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

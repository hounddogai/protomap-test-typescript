import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintCycleEngine } from "./complaint-cycle-engine.js";
import { newComplaintCycle } from "./complaint-cycle.js";

test("ComplaintCycleEngine keeps results within bounds", () => {
  const engine = defaultComplaintCycleEngine(flags.newRegistry());
  const item = newComplaintCycle("code-102", "label-525");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

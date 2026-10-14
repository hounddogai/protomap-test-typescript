import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgeAllocationEngine } from "./nudge-allocation-engine.js";
import { newNudgeAllocation } from "./nudge-allocation.js";

test("NudgeAllocationEngine keeps results within bounds", () => {
  const engine = defaultNudgeAllocationEngine();
  const item = newNudgeAllocation("code-402", "name-866");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

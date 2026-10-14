import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveMentionAllocationEngine } from "./adaptive-mention-allocation-engine.js";
import { newAdaptiveMentionAllocation } from "./adaptive-mention-allocation.js";

test("AdaptiveMentionAllocationEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveMentionAllocationEngine(flags.newRegistry());
  const item = newAdaptiveMentionAllocation("code-852", "name-825");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

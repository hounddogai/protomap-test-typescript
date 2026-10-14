import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionAllocationEngine } from "./retention-allocation-engine.js";
import { newRetentionAllocation } from "./retention-allocation.js";

test("RetentionAllocationEngine keeps results within bounds", () => {
  const engine = defaultRetentionAllocationEngine(flags.newRegistry());
  const item = newRetentionAllocation("code-103", "label-888");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

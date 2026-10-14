import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostAllocationEngine } from "./post-allocation-engine.js";
import { newPostAllocation } from "./post-allocation.js";

test("PostAllocationEngine keeps results within bounds", () => {
  const engine = defaultPostAllocationEngine(flags.newRegistry());
  const item = newPostAllocation("code-597", "label-794");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreativeAllocationEngine } from "./creative-allocation-engine.js";
import { newCreativeAllocation } from "./creative-allocation.js";

test("CreativeAllocationEngine keeps results within bounds", () => {
  const engine = defaultCreativeAllocationEngine(flags.newRegistry());
  const item = newCreativeAllocation("code-999", "name-354");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

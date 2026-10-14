import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelAllocationEngine } from "./model-allocation-engine.js";
import { newModelAllocation } from "./model-allocation.js";

test("ModelAllocationEngine keeps results within bounds", () => {
  const engine = defaultModelAllocationEngine();
  const item = newModelAllocation("code-95", "label-12");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

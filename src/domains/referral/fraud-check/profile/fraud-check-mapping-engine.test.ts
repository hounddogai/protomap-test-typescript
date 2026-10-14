import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFraudCheckMappingEngine } from "./fraud-check-mapping-engine.js";
import { newFraudCheckMapping } from "./fraud-check-mapping.js";

test("FraudCheckMappingEngine keeps results within bounds", () => {
  const engine = defaultFraudCheckMappingEngine(flags.newRegistry());
  const item = newFraudCheckMapping("code-532", "label-256");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

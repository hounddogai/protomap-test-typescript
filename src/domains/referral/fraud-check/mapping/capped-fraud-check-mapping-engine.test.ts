import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedFraudCheckMappingEngine } from "./capped-fraud-check-mapping-engine.js";
import { newCappedFraudCheckMapping } from "./capped-fraud-check-mapping.js";

test("CappedFraudCheckMappingEngine keeps results within bounds", () => {
  const engine = defaultCappedFraudCheckMappingEngine(flags.newRegistry());
  const item = newCappedFraudCheckMapping("code-398", "title-729");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

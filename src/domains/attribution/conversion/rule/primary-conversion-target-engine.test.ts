import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryConversionTargetEngine } from "./primary-conversion-target-engine.js";
import { newPrimaryConversionTarget } from "./primary-conversion-target.js";

test("PrimaryConversionTargetEngine keeps results within bounds", () => {
  const engine = defaultPrimaryConversionTargetEngine();
  const item = newPrimaryConversionTarget("code-18", "title-358");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultConversionCycleEngine } from "./conversion-cycle-engine.js";
import { newConversionCycle } from "./conversion-cycle.js";

test("ConversionCycleEngine keeps results within bounds", () => {
  const engine = defaultConversionCycleEngine();
  const item = newConversionCycle("code-477", "name-325");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

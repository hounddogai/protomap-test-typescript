import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionTargetEngine } from "./conversion-target-engine.js";
import { newConversionTarget } from "./conversion-target.js";

test("ConversionTargetEngine keeps results within bounds", () => {
  const engine = defaultConversionTargetEngine(flags.newRegistry());
  const item = newConversionTarget("code-471", "name-285");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

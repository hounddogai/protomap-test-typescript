import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionAdjustmentEngine } from "./conversion-adjustment-engine.js";
import { newConversionAdjustment } from "./conversion-adjustment.js";

test("ConversionAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultConversionAdjustmentEngine(flags.newRegistry());
  const item = newConversionAdjustment("code-861", "title-343");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

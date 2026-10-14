import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionSlotEngine } from "./conversion-slot-engine.js";
import { newConversionSlot } from "./conversion-slot.js";

test("ConversionSlotEngine keeps results within bounds", () => {
  const engine = defaultConversionSlotEngine(flags.newRegistry());
  const item = newConversionSlot("code-653", "title-920");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

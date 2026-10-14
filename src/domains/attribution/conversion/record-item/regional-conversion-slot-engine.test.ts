import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalConversionSlotEngine } from "./regional-conversion-slot-engine.js";
import { newRegionalConversionSlot } from "./regional-conversion-slot.js";

test("RegionalConversionSlotEngine keeps results within bounds", () => {
  const engine = defaultRegionalConversionSlotEngine(flags.newRegistry());
  const item = newRegionalConversionSlot("code-187", "title-607");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

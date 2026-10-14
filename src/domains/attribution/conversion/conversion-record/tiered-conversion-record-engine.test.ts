import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredConversionRecordEngine } from "./tiered-conversion-record-engine.js";
import { newTieredConversionRecord } from "./tiered-conversion-record.js";

test("TieredConversionRecordEngine keeps results within bounds", () => {
  const engine = defaultTieredConversionRecordEngine(flags.newRegistry());
  const item = newTieredConversionRecord("code-785", "name-947");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

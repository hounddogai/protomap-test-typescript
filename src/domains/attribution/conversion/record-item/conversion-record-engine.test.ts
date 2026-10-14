import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionRecordEngine } from "./conversion-record-engine.js";
import { newConversionRecord } from "./conversion-record.js";

test("ConversionRecordEngine keeps results within bounds", () => {
  const engine = defaultConversionRecordEngine(flags.newRegistry());
  const item = newConversionRecord("code-409", "title-545");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

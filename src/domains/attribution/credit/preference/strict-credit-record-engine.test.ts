import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictCreditRecordEngine } from "./strict-credit-record-engine.js";
import { newStrictCreditRecord } from "./strict-credit-record.js";

test("StrictCreditRecordEngine keeps results within bounds", () => {
  const engine = defaultStrictCreditRecordEngine(flags.newRegistry());
  const item = newStrictCreditRecord("code-209", "title-274");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

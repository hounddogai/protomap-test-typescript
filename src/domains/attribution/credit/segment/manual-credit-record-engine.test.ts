import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualCreditRecordEngine } from "./manual-credit-record-engine.js";
import { newManualCreditRecord } from "./manual-credit-record.js";

test("ManualCreditRecordEngine keeps results within bounds", () => {
  const engine = defaultManualCreditRecordEngine(flags.newRegistry());
  const item = newManualCreditRecord("code-374", "name-896");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDoubleOptInRecordEngine } from "./double-opt-in-record-engine.js";
import { newDoubleOptInRecord } from "./double-opt-in-record.js";

test("DoubleOptInRecordEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInRecordEngine(flags.newRegistry());
  const item = newDoubleOptInRecord("code-502", "label-466");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

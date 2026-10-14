import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingDoubleOptInRecordEngine } from "./rolling-double-opt-in-record-engine.js";
import { newRollingDoubleOptInRecord } from "./rolling-double-opt-in-record.js";

test("RollingDoubleOptInRecordEngine keeps results within bounds", () => {
  const engine = defaultRollingDoubleOptInRecordEngine(flags.newRegistry());
  const item = newRollingDoubleOptInRecord("code-23", "name-577");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

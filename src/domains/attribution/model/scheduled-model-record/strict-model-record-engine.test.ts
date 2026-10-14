import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictModelRecordEngine } from "./strict-model-record-engine.js";
import { newStrictModelRecord } from "./strict-model-record.js";

test("StrictModelRecordEngine keeps results within bounds", () => {
  const engine = defaultStrictModelRecordEngine(flags.newRegistry());
  const item = newStrictModelRecord("code-462", "name-416");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

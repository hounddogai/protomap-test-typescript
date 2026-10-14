import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultModelRecordEngine } from "./model-record-engine.js";
import { newModelRecord } from "./model-record.js";

test("ModelRecordEngine keeps results within bounds", () => {
  const engine = defaultModelRecordEngine(flags.newRegistry());
  const item = newModelRecord("code-910", "name-264");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionRecordEngine } from "./deflection-record-engine.js";
import { newDeflectionRecord } from "./deflection-record.js";

test("DeflectionRecordEngine keeps results within bounds", () => {
  const engine = defaultDeflectionRecordEngine(flags.newRegistry());
  const item = newDeflectionRecord("code-818", "name-198");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

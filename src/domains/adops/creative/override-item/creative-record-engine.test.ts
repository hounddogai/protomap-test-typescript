import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreativeRecordEngine } from "./creative-record-engine.js";
import { newCreativeRecord } from "./creative-record.js";

test("CreativeRecordEngine keeps results within bounds", () => {
  const engine = defaultCreativeRecordEngine(flags.newRegistry());
  const item = newCreativeRecord("code-966", "name-908");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

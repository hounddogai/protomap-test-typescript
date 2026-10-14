import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultCsatRecordEngine } from "./default-csat-record-engine.js";
import { newDefaultCsatRecord } from "./default-csat-record.js";

test("DefaultCsatRecordEngine keeps results within bounds", () => {
  const engine = defaultDefaultCsatRecordEngine(flags.newRegistry());
  const item = newDefaultCsatRecord("code-911", "title-381");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

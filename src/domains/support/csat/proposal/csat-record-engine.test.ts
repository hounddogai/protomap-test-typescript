import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatRecordEngine } from "./csat-record-engine.js";
import { newCsatRecord } from "./csat-record.js";

test("CsatRecordEngine keeps results within bounds", () => {
  const engine = defaultCsatRecordEngine();
  const item = newCsatRecord("code-645", "title-678");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

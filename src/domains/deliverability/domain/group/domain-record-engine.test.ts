import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDomainRecordEngine } from "./domain-record-engine.js";
import { newDomainRecord } from "./domain-record.js";

test("DomainRecordEngine keeps results within bounds", () => {
  const engine = defaultDomainRecordEngine();
  const item = newDomainRecord("code-849", "label-163");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

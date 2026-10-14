import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledDomainRecordEngine } from "./scheduled-domain-record-engine.js";
import { newScheduledDomainRecord } from "./scheduled-domain-record.js";

test("ScheduledDomainRecordEngine keeps results within bounds", () => {
  const engine = defaultScheduledDomainRecordEngine(flags.newRegistry());
  const item = newScheduledDomainRecord("code-914", "title-216");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

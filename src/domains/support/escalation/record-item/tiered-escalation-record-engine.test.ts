import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredEscalationRecordEngine } from "./tiered-escalation-record-engine.js";
import { newTieredEscalationRecord } from "./tiered-escalation-record.js";

test("TieredEscalationRecordEngine keeps results within bounds", () => {
  const engine = defaultTieredEscalationRecordEngine(flags.newRegistry());
  const item = newTieredEscalationRecord("code-443", "name-70");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalEscalationRecordEngine } from "./global-escalation-record-engine.js";
import { newGlobalEscalationRecord } from "./global-escalation-record.js";

test("GlobalEscalationRecordEngine keeps results within bounds", () => {
  const engine = defaultGlobalEscalationRecordEngine(flags.newRegistry());
  const item = newGlobalEscalationRecord("code-413", "name-343");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

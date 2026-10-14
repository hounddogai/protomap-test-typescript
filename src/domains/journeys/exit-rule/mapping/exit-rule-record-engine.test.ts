import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleRecordEngine } from "./exit-rule-record-engine.js";
import { newExitRuleRecord } from "./exit-rule-record.js";

test("ExitRuleRecordEngine keeps results within bounds", () => {
  const engine = defaultExitRuleRecordEngine(flags.newRegistry());
  const item = newExitRuleRecord("code-278", "label-207");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleEntryEngine } from "./exit-rule-entry-engine.js";
import { newExitRuleEntry } from "./exit-rule-entry.js";

test("ExitRuleEntryEngine keeps results within bounds", () => {
  const engine = defaultExitRuleEntryEngine(flags.newRegistry());
  const item = newExitRuleEntry("code-468", "label-257");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

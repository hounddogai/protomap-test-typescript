import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalExitRuleEntryEngine } from "./global-exit-rule-entry-engine.js";
import { newGlobalExitRuleEntry } from "./global-exit-rule-entry.js";

test("GlobalExitRuleEntryEngine keeps results within bounds", () => {
  const engine = defaultGlobalExitRuleEntryEngine(flags.newRegistry());
  const item = newGlobalExitRuleEntry("code-757", "label-957");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

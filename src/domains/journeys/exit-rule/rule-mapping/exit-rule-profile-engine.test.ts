import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleProfileEngine } from "./exit-rule-profile-engine.js";
import { newExitRuleProfile } from "./exit-rule-profile.js";

test("ExitRuleProfileEngine keeps results within bounds", () => {
  const engine = defaultExitRuleProfileEngine(flags.newRegistry());
  const item = newExitRuleProfile("code-286", "label-458");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

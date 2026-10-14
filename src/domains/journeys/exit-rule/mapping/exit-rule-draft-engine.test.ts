import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultExitRuleDraftEngine } from "./exit-rule-draft-engine.js";
import { newExitRuleDraft } from "./exit-rule-draft.js";

test("ExitRuleDraftEngine keeps results within bounds", () => {
  const engine = defaultExitRuleDraftEngine(flags.newRegistry());
  const item = newExitRuleDraft("code-3", "title-118");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

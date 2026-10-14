import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictExitRuleDraftEngine } from "./strict-exit-rule-draft-engine.js";
import { newStrictExitRuleDraft } from "./strict-exit-rule-draft.js";

test("StrictExitRuleDraftEngine keeps results within bounds", () => {
  const engine = defaultStrictExitRuleDraftEngine(flags.newRegistry());
  const item = newStrictExitRuleDraft("code-743", "title-558");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

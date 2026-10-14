import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveExitRuleDraftEngine } from "./adaptive-exit-rule-draft-engine.js";
import { newAdaptiveExitRuleDraft } from "./adaptive-exit-rule-draft.js";

test("AdaptiveExitRuleDraftEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveExitRuleDraftEngine();
  const item = newAdaptiveExitRuleDraft("code-75", "name-537");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

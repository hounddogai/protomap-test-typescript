import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStepDraftEngine } from "./step-draft-engine.js";
import { newStepDraft } from "./step-draft.js";

test("StepDraftEngine keeps results within bounds", () => {
  const engine = defaultStepDraftEngine();
  const item = newStepDraft("code-983", "label-486");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

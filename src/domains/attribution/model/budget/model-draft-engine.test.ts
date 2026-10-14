import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelDraftEngine } from "./model-draft-engine.js";
import { newModelDraft } from "./model-draft.js";

test("ModelDraftEngine keeps results within bounds", () => {
  const engine = defaultModelDraftEngine();
  const item = newModelDraft("code-98", "title-23");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

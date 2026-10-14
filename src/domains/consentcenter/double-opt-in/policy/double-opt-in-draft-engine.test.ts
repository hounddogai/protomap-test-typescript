import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDoubleOptInDraftEngine } from "./double-opt-in-draft-engine.js";
import { newDoubleOptInDraft } from "./double-opt-in-draft.js";

test("DoubleOptInDraftEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInDraftEngine();
  const item = newDoubleOptInDraft("code-427", "label-538");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

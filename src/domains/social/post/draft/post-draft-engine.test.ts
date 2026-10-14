import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostDraftEngine } from "./post-draft-engine.js";
import { newPostDraft } from "./post-draft.js";

test("PostDraftEngine keeps results within bounds", () => {
  const engine = defaultPostDraftEngine();
  const item = newPostDraft("code-655", "name-115");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

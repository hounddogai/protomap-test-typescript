import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReplyDraftEngine } from "./reply-draft-engine.js";
import { newReplyDraft } from "./reply-draft.js";

test("ReplyDraftEngine keeps results within bounds", () => {
  const engine = defaultReplyDraftEngine();
  const item = newReplyDraft("code-996", "label-835");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

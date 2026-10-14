import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientQueueDraftStore } from "./lenient-queue-draft-store.js";
import { newLenientQueueDraft } from "./lenient-queue-draft.js";

test("MemoryLenientQueueDraftStore finds what it saved", () => {
  const store = newMemoryLenientQueueDraftStore();
  const item = newLenientQueueDraft("code-753", "label-72");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionRequestStore } from "./mention-request-store.js";
import { newMentionRequest } from "./mention-request.js";

test("MemoryMentionRequestStore finds what it saved", () => {
  const store = newMemoryMentionRequestStore();
  const item = newMentionRequest("code-153", "title-81");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

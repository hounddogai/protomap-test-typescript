import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeDraftStore } from "./challenge-draft-store.js";
import { newChallengeDraft } from "./challenge-draft.js";

test("MemoryChallengeDraftStore finds what it saved", () => {
  const store = newMemoryChallengeDraftStore();
  const item = newChallengeDraft("code-258", "label-270");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

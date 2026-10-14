import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationDraftStore } from "./activation-draft-store.js";
import { newActivationDraft } from "./activation-draft.js";

test("MemoryActivationDraftStore finds what it saved", () => {
  const store = newMemoryActivationDraftStore();
  const item = newActivationDraft("code-430", "name-316");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

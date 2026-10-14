import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofDraftStore } from "./proof-draft-store.js";
import { newProofDraft } from "./proof-draft.js";

test("MemoryProofDraftStore finds what it saved", () => {
  const store = newMemoryProofDraftStore();
  const item = newProofDraft("code-74", "name-482");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

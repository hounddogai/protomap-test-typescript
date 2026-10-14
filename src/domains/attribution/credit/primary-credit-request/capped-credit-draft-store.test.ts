import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedCreditDraftStore } from "./capped-credit-draft-store.js";
import { newCappedCreditDraft } from "./capped-credit-draft.js";

test("MemoryCappedCreditDraftStore finds what it saved", () => {
  const store = newMemoryCappedCreditDraftStore();
  const item = newCappedCreditDraft("code-549", "title-854");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

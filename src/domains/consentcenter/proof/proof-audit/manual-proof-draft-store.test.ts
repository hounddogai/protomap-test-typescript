import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualProofDraftStore } from "./manual-proof-draft-store.js";
import { newManualProofDraft } from "./manual-proof-draft.js";

test("MemoryManualProofDraftStore finds what it saved", () => {
  const store = newMemoryManualProofDraftStore();
  const item = newManualProofDraft("code-665", "label-70");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

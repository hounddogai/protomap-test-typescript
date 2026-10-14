import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualStepDraftStore } from "./manual-step-draft-store.js";
import { newManualStepDraft } from "./manual-step-draft.js";

test("MemoryManualStepDraftStore finds what it saved", () => {
  const store = newMemoryManualStepDraftStore();
  const item = newManualStepDraft("code-597", "label-986");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

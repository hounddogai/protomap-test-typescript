import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionDraftStore } from "./conversion-draft-store.js";
import { newConversionDraft } from "./conversion-draft.js";

test("MemoryConversionDraftStore finds what it saved", () => {
  const store = newMemoryConversionDraftStore();
  const item = newConversionDraft("code-237", "label-68");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

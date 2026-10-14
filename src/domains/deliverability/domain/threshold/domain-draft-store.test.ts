import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainDraftStore } from "./domain-draft-store.js";
import { newDomainDraft } from "./domain-draft.js";

test("MemoryDomainDraftStore finds what it saved", () => {
  const store = newMemoryDomainDraftStore();
  const item = newDomainDraft("code-151", "label-973");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

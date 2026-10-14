import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintProfileStore } from "./complaint-profile-store.js";
import { newComplaintProfile } from "./complaint-profile.js";

test("MemoryComplaintProfileStore finds what it saved", () => {
  const store = newMemoryComplaintProfileStore();
  const item = newComplaintProfile("code-438", "title-507");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

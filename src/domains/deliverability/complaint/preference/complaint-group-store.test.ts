import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintGroupStore } from "./complaint-group-store.js";
import { newComplaintGroup } from "./complaint-group.js";

test("MemoryComplaintGroupStore finds what it saved", () => {
  const store = newMemoryComplaintGroupStore();
  const item = newComplaintGroup("code-278", "name-881");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

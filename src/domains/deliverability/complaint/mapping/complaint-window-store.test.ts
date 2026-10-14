import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintWindowStore } from "./complaint-window-store.js";
import { newComplaintWindow } from "./complaint-window.js";

test("MemoryComplaintWindowStore finds what it saved", () => {
  const store = newMemoryComplaintWindowStore();
  const item = newComplaintWindow("code-210", "name-507");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

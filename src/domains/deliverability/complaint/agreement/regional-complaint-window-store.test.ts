import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalComplaintWindowStore } from "./regional-complaint-window-store.js";
import { newRegionalComplaintWindow } from "./regional-complaint-window.js";

test("MemoryRegionalComplaintWindowStore finds what it saved", () => {
  const store = newMemoryRegionalComplaintWindowStore();
  const item = newRegionalComplaintWindow("code-965", "name-732");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

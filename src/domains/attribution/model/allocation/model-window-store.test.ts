import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryModelWindowStore } from "./model-window-store.js";
import { newModelWindow } from "./model-window.js";

test("MemoryModelWindowStore finds what it saved", () => {
  const store = newMemoryModelWindowStore();
  const item = newModelWindow("code-509", "name-925");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

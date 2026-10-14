import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryLevelWindowStore } from "./primary-level-window-store.js";
import { newPrimaryLevelWindow } from "./primary-level-window.js";

test("MemoryPrimaryLevelWindowStore finds what it saved", () => {
  const store = newMemoryPrimaryLevelWindowStore();
  const item = newPrimaryLevelWindow("code-541", "name-879");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

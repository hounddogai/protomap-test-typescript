import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelWindowStore } from "./level-window-store.js";
import { newLevelWindow } from "./level-window.js";

test("MemoryLevelWindowStore finds what it saved", () => {
  const store = newMemoryLevelWindowStore();
  const item = newLevelWindow("code-675", "name-400");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

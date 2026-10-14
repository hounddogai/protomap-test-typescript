import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCreativeWindowStore } from "./legacy-creative-window-store.js";
import { newLegacyCreativeWindow } from "./legacy-creative-window.js";

test("MemoryLegacyCreativeWindowStore finds what it saved", () => {
  const store = newMemoryLegacyCreativeWindowStore();
  const item = newLegacyCreativeWindow("code-143", "name-329");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

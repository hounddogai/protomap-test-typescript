import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryStepWindowStore } from "./primary-step-window-store.js";
import { newPrimaryStepWindow } from "./primary-step-window.js";

test("MemoryPrimaryStepWindowStore finds what it saved", () => {
  const store = newMemoryPrimaryStepWindowStore();
  const item = newPrimaryStepWindow("code-532", "name-370");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

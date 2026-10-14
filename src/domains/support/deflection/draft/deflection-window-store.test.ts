import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionWindowStore } from "./deflection-window-store.js";
import { newDeflectionWindow } from "./deflection-window.js";

test("MemoryDeflectionWindowStore finds what it saved", () => {
  const store = newMemoryDeflectionWindowStore();
  const item = newDeflectionWindow("code-375", "name-881");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

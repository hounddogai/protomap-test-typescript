import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedWaitWindowStore } from "./capped-wait-window-store.js";
import { newCappedWaitWindow } from "./capped-wait-window.js";

test("MemoryCappedWaitWindowStore finds what it saved", () => {
  const store = newMemoryCappedWaitWindowStore();
  const item = newCappedWaitWindow("code-803", "name-19");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

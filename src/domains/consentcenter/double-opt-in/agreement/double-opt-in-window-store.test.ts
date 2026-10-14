import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInWindowStore } from "./double-opt-in-window-store.js";
import { newDoubleOptInWindow } from "./double-opt-in-window.js";

test("MemoryDoubleOptInWindowStore finds what it saved", () => {
  const store = newMemoryDoubleOptInWindowStore();
  const item = newDoubleOptInWindow("code-593", "title-141");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

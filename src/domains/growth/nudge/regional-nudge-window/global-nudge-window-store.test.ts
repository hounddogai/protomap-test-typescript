import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalNudgeWindowStore } from "./global-nudge-window-store.js";
import { newGlobalNudgeWindow } from "./global-nudge-window.js";

test("MemoryGlobalNudgeWindowStore finds what it saved", () => {
  const store = newMemoryGlobalNudgeWindowStore();
  const item = newGlobalNudgeWindow("code-693", "name-835");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

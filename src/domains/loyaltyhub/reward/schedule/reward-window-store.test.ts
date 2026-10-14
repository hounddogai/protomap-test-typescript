import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardWindowStore } from "./reward-window-store.js";
import { newRewardWindow } from "./reward-window.js";

test("MemoryRewardWindowStore finds what it saved", () => {
  const store = newMemoryRewardWindowStore();
  const item = newRewardWindow("code-800", "title-209");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

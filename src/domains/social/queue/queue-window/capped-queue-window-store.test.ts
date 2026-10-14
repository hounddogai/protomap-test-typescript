import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedQueueWindowStore } from "./capped-queue-window-store.js";
import { newCappedQueueWindow } from "./capped-queue-window.js";

test("MemoryCappedQueueWindowStore finds what it saved", () => {
  const store = newMemoryCappedQueueWindowStore();
  const item = newCappedQueueWindow("code-176", "name-436");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

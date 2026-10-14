import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationWindowStore } from "./reputation-window-store.js";
import { newReputationWindow } from "./reputation-window.js";

test("MemoryReputationWindowStore finds what it saved", () => {
  const store = newMemoryReputationWindowStore();
  const item = newReputationWindow("code-381", "label-615");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

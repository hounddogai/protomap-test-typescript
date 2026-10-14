import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingStreakBundleStore } from "./pending-streak-bundle-store.js";
import { newPendingStreakBundle } from "./pending-streak-bundle.js";

test("MemoryPendingStreakBundleStore finds what it saved", () => {
  const store = newMemoryPendingStreakBundleStore();
  const item = newPendingStreakBundle("code-646", "label-896");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

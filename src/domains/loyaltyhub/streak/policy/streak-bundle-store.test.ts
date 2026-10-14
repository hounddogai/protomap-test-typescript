import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakBundleStore } from "./streak-bundle-store.js";
import { newStreakBundle } from "./streak-bundle.js";

test("MemoryStreakBundleStore finds what it saved", () => {
  const store = newMemoryStreakBundleStore();
  const item = newStreakBundle("code-94", "title-730");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

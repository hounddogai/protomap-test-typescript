import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalStreakBundleStore } from "./seasonal-streak-bundle-store.js";
import { newSeasonalStreakBundle } from "./seasonal-streak-bundle.js";

test("MemorySeasonalStreakBundleStore finds what it saved", () => {
  const store = newMemorySeasonalStreakBundleStore();
  const item = newSeasonalStreakBundle("code-42", "label-894");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

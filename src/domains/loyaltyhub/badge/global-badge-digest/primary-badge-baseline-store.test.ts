import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryBadgeBaselineStore } from "./primary-badge-baseline-store.js";
import { newPrimaryBadgeBaseline } from "./primary-badge-baseline.js";

test("MemoryPrimaryBadgeBaselineStore finds what it saved", () => {
  const store = newMemoryPrimaryBadgeBaselineStore();
  const item = newPrimaryBadgeBaseline("code-551", "name-948");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

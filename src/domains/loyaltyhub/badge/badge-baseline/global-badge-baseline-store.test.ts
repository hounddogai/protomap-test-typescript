import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalBadgeBaselineStore } from "./global-badge-baseline-store.js";
import { newGlobalBadgeBaseline } from "./global-badge-baseline.js";

test("MemoryGlobalBadgeBaselineStore finds what it saved", () => {
  const store = newMemoryGlobalBadgeBaselineStore();
  const item = newGlobalBadgeBaseline("code-634", "label-377");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

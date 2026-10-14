import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeBaselineStore } from "./badge-baseline-store.js";
import { newBadgeBaseline } from "./badge-baseline.js";

test("MemoryBadgeBaselineStore finds what it saved", () => {
  const store = newMemoryBadgeBaselineStore();
  const item = newBadgeBaseline("code-421", "name-361");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

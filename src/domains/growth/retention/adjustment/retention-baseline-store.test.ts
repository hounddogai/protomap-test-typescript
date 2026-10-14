import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionBaselineStore } from "./retention-baseline-store.js";
import { newRetentionBaseline } from "./retention-baseline.js";

test("MemoryRetentionBaselineStore finds what it saved", () => {
  const store = newMemoryRetentionBaselineStore();
  const item = newRetentionBaseline("code-327", "title-331");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

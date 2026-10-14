import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInsightQuotaStore } from "./insight-quota-store.js";
import { newInsightQuota } from "./insight-quota.js";

test("MemoryInsightQuotaStore finds what it saved", () => {
  const store = newMemoryInsightQuotaStore();
  const item = newInsightQuota("code-996", "title-534");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

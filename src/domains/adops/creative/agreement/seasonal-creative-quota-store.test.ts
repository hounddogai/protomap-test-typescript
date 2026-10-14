import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCreativeQuotaStore } from "./seasonal-creative-quota-store.js";
import { newSeasonalCreativeQuota } from "./seasonal-creative-quota.js";

test("MemorySeasonalCreativeQuotaStore finds what it saved", () => {
  const store = newMemorySeasonalCreativeQuotaStore();
  const item = newSeasonalCreativeQuota("code-954", "label-339");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

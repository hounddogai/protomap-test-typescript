import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryConversionQuotaStore } from "./conversion-quota-store.js";
import { newConversionQuota } from "./conversion-quota.js";

test("MemoryConversionQuotaStore finds what it saved", () => {
  const store = newMemoryConversionQuotaStore();
  const item = newConversionQuota("code-711", "name-72");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

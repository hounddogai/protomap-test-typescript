import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDeflectionQuotaStore } from "./deflection-quota-store.js";
import { newDeflectionQuota } from "./deflection-quota.js";

test("MemoryDeflectionQuotaStore finds what it saved", () => {
  const store = newMemoryDeflectionQuotaStore();
  const item = newDeflectionQuota("code-342", "title-974");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

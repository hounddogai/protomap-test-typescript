import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatPolicyStore } from "./csat-policy-store.js";
import { newCsatPolicy } from "./csat-policy.js";

test("MemoryCsatPolicyStore finds what it saved", () => {
  const store = newMemoryCsatPolicyStore();
  const item = newCsatPolicy("code-74", "title-136");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictCsatPolicyStore } from "./strict-csat-policy-store.js";
import { newStrictCsatPolicy } from "./strict-csat-policy.js";

test("MemoryStrictCsatPolicyStore finds what it saved", () => {
  const store = newMemoryStrictCsatPolicyStore();
  const item = newStrictCsatPolicy("code-745", "label-220");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

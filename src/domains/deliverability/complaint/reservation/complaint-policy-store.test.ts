import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintPolicyStore } from "./complaint-policy-store.js";
import { newComplaintPolicy } from "./complaint-policy.js";

test("MemoryComplaintPolicyStore finds what it saved", () => {
  const store = newMemoryComplaintPolicyStore();
  const item = newComplaintPolicy("code-554", "title-877");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

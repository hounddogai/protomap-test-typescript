import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingPolicyStore } from "./pacing-policy-store.js";
import { newPacingPolicy } from "./pacing-policy.js";

test("MemoryPacingPolicyStore finds what it saved", () => {
  const store = newMemoryPacingPolicyStore();
  const item = newPacingPolicy("code-110", "label-638");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyQueuePolicyStore } from "./legacy-queue-policy-store.js";
import { newLegacyQueuePolicy } from "./legacy-queue-policy.js";

test("MemoryLegacyQueuePolicyStore finds what it saved", () => {
  const store = newMemoryLegacyQueuePolicyStore();
  const item = newLegacyQueuePolicy("code-388", "label-588");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

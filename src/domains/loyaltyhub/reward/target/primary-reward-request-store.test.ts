import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryRewardRequestStore } from "./primary-reward-request-store.js";
import { newPrimaryRewardRequest } from "./primary-reward-request.js";

test("MemoryPrimaryRewardRequestStore finds what it saved", () => {
  const store = newMemoryPrimaryRewardRequestStore();
  const item = newPrimaryRewardRequest("code-434", "name-937");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

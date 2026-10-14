import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRequestStore } from "./reward-request-store.js";
import { newRewardRequest } from "./reward-request.js";

test("MemoryRewardRequestStore finds what it saved", () => {
  const store = newMemoryRewardRequestStore();
  const item = newRewardRequest("code-94", "label-253");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingRewardRequestStore } from "./rolling-reward-request-store.js";
import { newRollingRewardRequest } from "./rolling-reward-request.js";

test("MemoryRollingRewardRequestStore finds what it saved", () => {
  const store = newMemoryRollingRewardRequestStore();
  const item = newRollingRewardRequest("code-273", "label-794");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

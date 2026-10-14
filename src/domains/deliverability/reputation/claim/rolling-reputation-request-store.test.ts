import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingReputationRequestStore } from "./rolling-reputation-request-store.js";
import { newRollingReputationRequest } from "./rolling-reputation-request.js";

test("MemoryRollingReputationRequestStore finds what it saved", () => {
  const store = newMemoryRollingReputationRequestStore();
  const item = newRollingReputationRequest("code-2", "label-816");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBounceRequestStore } from "./tiered-bounce-request-store.js";
import { newTieredBounceRequest } from "./tiered-bounce-request.js";

test("MemoryTieredBounceRequestStore finds what it saved", () => {
  const store = newMemoryTieredBounceRequestStore();
  const item = newTieredBounceRequest("code-151", "title-828");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRedemptionRequestStore } from "./redemption-request-store.js";
import { newRedemptionRequest } from "./redemption-request.js";

test("MemoryRedemptionRequestStore finds what it saved", () => {
  const store = newMemoryRedemptionRequestStore();
  const item = newRedemptionRequest("code-262", "name-28");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

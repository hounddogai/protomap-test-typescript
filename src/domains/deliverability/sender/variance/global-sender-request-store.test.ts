import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalSenderRequestStore } from "./global-sender-request-store.js";
import { newGlobalSenderRequest } from "./global-sender-request.js";

test("MemoryGlobalSenderRequestStore finds what it saved", () => {
  const store = newMemoryGlobalSenderRequestStore();
  const item = newGlobalSenderRequest("code-212", "name-643");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

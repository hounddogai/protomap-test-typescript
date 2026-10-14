import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderRequestStore } from "./sender-request-store.js";
import { newSenderRequest } from "./sender-request.js";

test("MemorySenderRequestStore finds what it saved", () => {
  const store = newMemorySenderRequestStore();
  const item = newSenderRequest("code-634", "title-270");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

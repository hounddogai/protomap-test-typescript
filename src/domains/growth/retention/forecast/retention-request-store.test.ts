import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionRequestStore } from "./retention-request-store.js";
import { newRetentionRequest } from "./retention-request.js";

test("MemoryRetentionRequestStore finds what it saved", () => {
  const store = newMemoryRetentionRequestStore();
  const item = newRetentionRequest("code-711", "name-688");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

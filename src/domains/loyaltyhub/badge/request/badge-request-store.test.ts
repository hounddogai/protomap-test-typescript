import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeRequestStore } from "./badge-request-store.js";
import { newBadgeRequest } from "./badge-request.js";

test("MemoryBadgeRequestStore finds what it saved", () => {
  const store = newMemoryBadgeRequestStore();
  const item = newBadgeRequest("code-940", "label-769");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

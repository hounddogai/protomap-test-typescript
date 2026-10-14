import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeRequestStore } from "./creative-request-store.js";
import { newCreativeRequest } from "./creative-request.js";

test("MemoryCreativeRequestStore finds what it saved", () => {
  const store = newMemoryCreativeRequestStore();
  const item = newCreativeRequest("code-985", "name-605");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

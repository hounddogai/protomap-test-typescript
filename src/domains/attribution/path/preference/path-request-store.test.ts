import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPathRequestStore } from "./path-request-store.js";
import { newPathRequest } from "./path-request.js";

test("MemoryPathRequestStore finds what it saved", () => {
  const store = newMemoryPathRequestStore();
  const item = newPathRequest("code-128", "name-321");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

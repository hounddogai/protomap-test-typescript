import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPathRequestStore } from "./regional-path-request-store.js";
import { newRegionalPathRequest } from "./regional-path-request.js";

test("MemoryRegionalPathRequestStore finds what it saved", () => {
  const store = newMemoryRegionalPathRequestStore();
  const item = newRegionalPathRequest("code-190", "name-498");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

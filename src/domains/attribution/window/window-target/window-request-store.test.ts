import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowRequestStore } from "./window-request-store.js";
import { newWindowRequest } from "./window-request.js";

test("MemoryWindowRequestStore finds what it saved", () => {
  const store = newMemoryWindowRequestStore();
  const item = newWindowRequest("code-699", "title-550");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

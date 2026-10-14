import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredLevelRequestStore } from "./tiered-level-request-store.js";
import { newTieredLevelRequest } from "./tiered-level-request.js";

test("MemoryTieredLevelRequestStore finds what it saved", () => {
  const store = newMemoryTieredLevelRequestStore();
  const item = newTieredLevelRequest("code-343", "name-540");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

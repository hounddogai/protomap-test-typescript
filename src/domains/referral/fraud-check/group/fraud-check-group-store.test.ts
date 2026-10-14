import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckGroupStore } from "./fraud-check-group-store.js";
import { newFraudCheckGroup } from "./fraud-check-group.js";

test("MemoryFraudCheckGroupStore finds what it saved", () => {
  const store = newMemoryFraudCheckGroupStore();
  const item = newFraudCheckGroup("code-232", "title-242");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

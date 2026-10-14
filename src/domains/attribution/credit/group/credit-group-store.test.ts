import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditGroupStore } from "./credit-group-store.js";
import { newCreditGroup } from "./credit-group.js";

test("MemoryCreditGroupStore finds what it saved", () => {
  const store = newMemoryCreditGroupStore();
  const item = newCreditGroup("code-89", "name-224");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

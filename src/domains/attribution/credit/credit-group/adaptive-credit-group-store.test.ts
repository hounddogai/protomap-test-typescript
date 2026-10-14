import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveCreditGroupStore } from "./adaptive-credit-group-store.js";
import { newAdaptiveCreditGroup } from "./adaptive-credit-group.js";

test("MemoryAdaptiveCreditGroupStore finds what it saved", () => {
  const store = newMemoryAdaptiveCreditGroupStore();
  const item = newAdaptiveCreditGroup("code-324", "title-286");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

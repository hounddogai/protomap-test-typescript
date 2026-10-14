import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionMappingStore } from "./subscription-mapping-store.js";
import { newSubscriptionMapping } from "./subscription-mapping.js";

test("MemorySubscriptionMappingStore finds what it saved", () => {
  const store = newMemorySubscriptionMappingStore();
  const item = newSubscriptionMapping("code-993", "title-412");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

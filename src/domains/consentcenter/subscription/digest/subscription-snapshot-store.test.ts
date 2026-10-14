import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionSnapshotStore } from "./subscription-snapshot-store.js";
import { newSubscriptionSnapshot } from "./subscription-snapshot.js";

test("MemorySubscriptionSnapshotStore finds what it saved", () => {
  const store = newMemorySubscriptionSnapshotStore();
  const item = newSubscriptionSnapshot("code-649", "name-803");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

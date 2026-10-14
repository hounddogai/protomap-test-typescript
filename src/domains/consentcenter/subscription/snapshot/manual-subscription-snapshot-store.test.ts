import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualSubscriptionSnapshotStore } from "./manual-subscription-snapshot-store.js";
import { newManualSubscriptionSnapshot } from "./manual-subscription-snapshot.js";

test("MemoryManualSubscriptionSnapshotStore finds what it saved", () => {
  const store = newMemoryManualSubscriptionSnapshotStore();
  const item = newManualSubscriptionSnapshot("code-179", "title-223");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallSnapshotStore } from "./paywall-snapshot-store.js";
import { newPaywallSnapshot } from "./paywall-snapshot.js";

test("MemoryPaywallSnapshotStore finds what it saved", () => {
  const store = newMemoryPaywallSnapshotStore();
  const item = newPaywallSnapshot("code-897", "label-931");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

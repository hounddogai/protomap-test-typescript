import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedPaywallSnapshotStore } from "./weighted-paywall-snapshot-store.js";
import { newWeightedPaywallSnapshot } from "./weighted-paywall-snapshot.js";

test("MemoryWeightedPaywallSnapshotStore finds what it saved", () => {
  const store = newMemoryWeightedPaywallSnapshotStore();
  const item = newWeightedPaywallSnapshot("code-155", "label-394");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

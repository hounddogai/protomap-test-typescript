import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalPaywallSnapshotStore } from "./regional-paywall-snapshot-store.js";
import { newRegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

test("MemoryRegionalPaywallSnapshotStore finds what it saved", () => {
  const store = newMemoryRegionalPaywallSnapshotStore();
  const item = newRegionalPaywallSnapshot("code-84", "label-728");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

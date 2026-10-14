import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPaywallSnapshotStore } from "./strict-paywall-snapshot-store.js";
import { newStrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

test("MemoryStrictPaywallSnapshotStore finds what it saved", () => {
  const store = newMemoryStrictPaywallSnapshotStore();
  const item = newStrictPaywallSnapshot("code-565", "title-914");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

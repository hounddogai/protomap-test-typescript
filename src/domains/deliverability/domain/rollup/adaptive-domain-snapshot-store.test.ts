import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDomainSnapshotStore } from "./adaptive-domain-snapshot-store.js";
import { newAdaptiveDomainSnapshot } from "./adaptive-domain-snapshot.js";

test("MemoryAdaptiveDomainSnapshotStore finds what it saved", () => {
  const store = newMemoryAdaptiveDomainSnapshotStore();
  const item = newAdaptiveDomainSnapshot("code-239", "label-75");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedDomainSnapshotStore } from "./weighted-domain-snapshot-store.js";
import { newWeightedDomainSnapshot } from "./weighted-domain-snapshot.js";

test("MemoryWeightedDomainSnapshotStore finds what it saved", () => {
  const store = newMemoryWeightedDomainSnapshotStore();
  const item = newWeightedDomainSnapshot("code-165", "title-934");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainSnapshotStore } from "./domain-snapshot-store.js";
import { newDomainSnapshot } from "./domain-snapshot.js";

test("MemoryDomainSnapshotStore finds what it saved", () => {
  const store = newMemoryDomainSnapshotStore();
  const item = newDomainSnapshot("code-862", "label-986");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

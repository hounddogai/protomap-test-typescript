import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryActivationSnapshotStore } from "./primary-activation-snapshot-store.js";
import { newPrimaryActivationSnapshot } from "./primary-activation-snapshot.js";

test("MemoryPrimaryActivationSnapshotStore finds what it saved", () => {
  const store = newMemoryPrimaryActivationSnapshotStore();
  const item = newPrimaryActivationSnapshot("code-169", "label-618");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationSnapshotStore } from "./activation-snapshot-store.js";
import { newActivationSnapshot } from "./activation-snapshot.js";

test("MemoryActivationSnapshotStore finds what it saved", () => {
  const store = newMemoryActivationSnapshotStore();
  const item = newActivationSnapshot("code-738", "title-647");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

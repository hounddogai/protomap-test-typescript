import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationSnapshotStore } from "./escalation-snapshot-store.js";
import { newEscalationSnapshot } from "./escalation-snapshot.js";

test("MemoryEscalationSnapshotStore finds what it saved", () => {
  const store = newMemoryEscalationSnapshotStore();
  const item = newEscalationSnapshot("code-253", "title-272");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

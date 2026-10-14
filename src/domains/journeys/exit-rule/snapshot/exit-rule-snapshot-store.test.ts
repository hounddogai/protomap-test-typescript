import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleSnapshotStore } from "./exit-rule-snapshot-store.js";
import { newExitRuleSnapshot } from "./exit-rule-snapshot.js";

test("MemoryExitRuleSnapshotStore finds what it saved", () => {
  const store = newMemoryExitRuleSnapshotStore();
  const item = newExitRuleSnapshot("code-815", "name-645");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

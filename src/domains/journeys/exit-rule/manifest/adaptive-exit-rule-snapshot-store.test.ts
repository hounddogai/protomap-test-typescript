import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveExitRuleSnapshotStore } from "./adaptive-exit-rule-snapshot-store.js";
import { newAdaptiveExitRuleSnapshot } from "./adaptive-exit-rule-snapshot.js";

test("MemoryAdaptiveExitRuleSnapshotStore finds what it saved", () => {
  const store = newMemoryAdaptiveExitRuleSnapshotStore();
  const item = newAdaptiveExitRuleSnapshot("code-417", "label-588");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

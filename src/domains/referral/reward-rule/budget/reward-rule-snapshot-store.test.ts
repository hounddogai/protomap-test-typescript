import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleSnapshotStore } from "./reward-rule-snapshot-store.js";
import { newRewardRuleSnapshot } from "./reward-rule-snapshot.js";

test("MemoryRewardRuleSnapshotStore finds what it saved", () => {
  const store = newMemoryRewardRuleSnapshotStore();
  const item = newRewardRuleSnapshot("code-63", "label-291");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

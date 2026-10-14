import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRewardRuleSegmentStore } from "./reward-rule-segment-store.js";
import { newRewardRuleSegment } from "./reward-rule-segment.js";

test("MemoryRewardRuleSegmentStore finds what it saved", () => {
  const store = newMemoryRewardRuleSegmentStore();
  const item = newRewardRuleSegment("code-839", "name-260");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

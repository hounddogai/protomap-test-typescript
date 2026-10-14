import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBidRuleSegmentStore } from "./bid-rule-segment-store.js";
import { newBidRuleSegment } from "./bid-rule-segment.js";

test("MemoryBidRuleSegmentStore finds what it saved", () => {
  const store = newMemoryBidRuleSegmentStore();
  const item = newBidRuleSegment("code-481", "label-255");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

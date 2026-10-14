import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySubscriptionSegmentStore } from "./primary-subscription-segment-store.js";
import { newPrimarySubscriptionSegment } from "./primary-subscription-segment.js";

test("MemoryPrimarySubscriptionSegmentStore finds what it saved", () => {
  const store = newMemoryPrimarySubscriptionSegmentStore();
  const item = newPrimarySubscriptionSegment("code-447", "title-201");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

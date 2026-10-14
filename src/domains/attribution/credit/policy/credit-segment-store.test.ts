import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditSegmentStore } from "./credit-segment-store.js";
import { newCreditSegment } from "./credit-segment.js";

test("MemoryCreditSegmentStore finds what it saved", () => {
  const store = newMemoryCreditSegmentStore();
  const item = newCreditSegment("code-553", "title-428");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

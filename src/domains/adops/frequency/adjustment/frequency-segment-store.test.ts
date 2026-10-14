import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencySegmentStore } from "./frequency-segment-store.js";
import { newFrequencySegment } from "./frequency-segment.js";

test("MemoryFrequencySegmentStore finds what it saved", () => {
  const store = newMemoryFrequencySegmentStore();
  const item = newFrequencySegment("code-490", "label-478");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

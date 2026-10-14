import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDoubleOptInSegmentStore } from "./legacy-double-opt-in-segment-store.js";
import { newLegacyDoubleOptInSegment } from "./legacy-double-opt-in-segment.js";

test("MemoryLegacyDoubleOptInSegmentStore finds what it saved", () => {
  const store = newMemoryLegacyDoubleOptInSegmentStore();
  const item = newLegacyDoubleOptInSegment("code-773", "title-159");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCreativeSegmentStore } from "./legacy-creative-segment-store.js";
import { newLegacyCreativeSegment } from "./legacy-creative-segment.js";

test("MemoryLegacyCreativeSegmentStore finds what it saved", () => {
  const store = newMemoryLegacyCreativeSegmentStore();
  const item = newLegacyCreativeSegment("code-84", "title-627");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPreferenceSegmentStore } from "./default-preference-segment-store.js";
import { newDefaultPreferenceSegment } from "./default-preference-segment.js";

test("MemoryDefaultPreferenceSegmentStore finds what it saved", () => {
  const store = newMemoryDefaultPreferenceSegmentStore();
  const item = newDefaultPreferenceSegment("code-606", "name-972");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointOverrideStore } from "./touchpoint-override-store.js";
import { newTouchpointOverride } from "./touchpoint-override.js";

test("MemoryTouchpointOverrideStore finds what it saved", () => {
  const store = newMemoryTouchpointOverrideStore();
  const item = newTouchpointOverride("code-211", "label-742");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

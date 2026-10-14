import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictTouchpointBaselineStore } from "./strict-touchpoint-baseline-store.js";
import { newStrictTouchpointBaseline } from "./strict-touchpoint-baseline.js";

test("MemoryStrictTouchpointBaselineStore finds what it saved", () => {
  const store = newMemoryStrictTouchpointBaselineStore();
  const item = newStrictTouchpointBaseline("code-298", "name-99");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

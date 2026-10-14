import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowThresholdStore } from "./window-threshold-store.js";
import { newWindowThreshold } from "./window-threshold.js";

test("MemoryWindowThresholdStore finds what it saved", () => {
  const store = newMemoryWindowThresholdStore();
  const item = newWindowThreshold("code-29", "title-318");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

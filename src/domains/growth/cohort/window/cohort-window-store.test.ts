import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortWindowStore } from "./cohort-window-store.js";
import { newCohortWindow } from "./cohort-window.js";

test("MemoryCohortWindowStore finds what it saved", () => {
  const store = newMemoryCohortWindowStore();
  const item = newCohortWindow("code-121", "name-1");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

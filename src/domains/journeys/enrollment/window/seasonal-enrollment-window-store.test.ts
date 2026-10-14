import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalEnrollmentWindowStore } from "./seasonal-enrollment-window-store.js";
import { newSeasonalEnrollmentWindow } from "./seasonal-enrollment-window.js";

test("MemorySeasonalEnrollmentWindowStore finds what it saved", () => {
  const store = newMemorySeasonalEnrollmentWindowStore();
  const item = newSeasonalEnrollmentWindow("code-874", "title-278");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

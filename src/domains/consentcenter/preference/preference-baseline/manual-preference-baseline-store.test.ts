import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualPreferenceBaselineStore } from "./manual-preference-baseline-store.js";
import { newManualPreferenceBaseline } from "./manual-preference-baseline.js";

test("MemoryManualPreferenceBaselineStore finds what it saved", () => {
  const store = newMemoryManualPreferenceBaselineStore();
  const item = newManualPreferenceBaseline("code-445", "title-138");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

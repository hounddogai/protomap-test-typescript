import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeSummaryStore } from "./creative-summary-store.js";
import { newCreativeSummary } from "./creative-summary.js";

test("MemoryCreativeSummaryStore finds what it saved", () => {
  const store = newMemoryCreativeSummaryStore();
  const item = newCreativeSummary("code-238", "name-950");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

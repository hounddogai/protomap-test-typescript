import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalBadgeBaselineStore } from "./seasonal-badge-baseline-store.js";
import { newSeasonalBadgeBaseline } from "./seasonal-badge-baseline.js";

test("MemorySeasonalBadgeBaselineStore finds what it saved", () => {
  const store = newMemorySeasonalBadgeBaselineStore();
  const item = newSeasonalBadgeBaseline("code-968", "title-315");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

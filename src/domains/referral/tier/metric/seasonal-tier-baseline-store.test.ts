import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalTierBaselineStore } from "./seasonal-tier-baseline-store.js";
import { newSeasonalTierBaseline } from "./seasonal-tier-baseline.js";

test("MemorySeasonalTierBaselineStore finds what it saved", () => {
  const store = newMemorySeasonalTierBaselineStore();
  const item = newSeasonalTierBaseline("code-366", "title-134");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalFunnelSummaryStore } from "./seasonal-funnel-summary-store.js";
import { newSeasonalFunnelSummary } from "./seasonal-funnel-summary.js";

test("MemorySeasonalFunnelSummaryStore finds what it saved", () => {
  const store = newMemorySeasonalFunnelSummaryStore();
  const item = newSeasonalFunnelSummary("code-520", "label-566");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

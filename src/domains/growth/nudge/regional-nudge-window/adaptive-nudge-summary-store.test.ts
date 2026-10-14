import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveNudgeSummaryStore } from "./adaptive-nudge-summary-store.js";
import { newAdaptiveNudgeSummary } from "./adaptive-nudge-summary.js";

test("MemoryAdaptiveNudgeSummaryStore finds what it saved", () => {
  const store = newMemoryAdaptiveNudgeSummaryStore();
  const item = newAdaptiveNudgeSummary("code-41", "title-542");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualTicketViewEstimateStore } from "./manual-ticket-view-estimate-store.js";
import { newManualTicketViewEstimate } from "./manual-ticket-view-estimate.js";

test("MemoryManualTicketViewEstimateStore finds what it saved", () => {
  const store = newMemoryManualTicketViewEstimateStore();
  const item = newManualTicketViewEstimate("code-500", "title-322");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

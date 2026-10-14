import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightSummaryStore } from "./flight-summary-store.js";
import { newFlightSummary } from "./flight-summary.js";

test("MemoryFlightSummaryStore finds what it saved", () => {
  const store = newMemoryFlightSummaryStore();
  const item = newFlightSummary("code-266", "name-824");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

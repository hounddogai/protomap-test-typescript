import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewThresholdStore } from "./ticket-view-threshold-store.js";
import { newTicketViewThreshold } from "./ticket-view-threshold.js";

test("MemoryTicketViewThresholdStore finds what it saved", () => {
  const store = newMemoryTicketViewThresholdStore();
  const item = newTicketViewThreshold("code-205", "label-811");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

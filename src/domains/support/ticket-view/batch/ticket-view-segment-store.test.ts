import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewSegmentStore } from "./ticket-view-segment-store.js";
import { newTicketViewSegment } from "./ticket-view-segment.js";

test("MemoryTicketViewSegmentStore finds what it saved", () => {
  const store = newMemoryTicketViewSegmentStore();
  const item = newTicketViewSegment("code-326", "label-833");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

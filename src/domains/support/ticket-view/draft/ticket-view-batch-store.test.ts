import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewBatchStore } from "./ticket-view-batch-store.js";
import { newTicketViewBatch } from "./ticket-view-batch.js";

test("MemoryTicketViewBatchStore finds what it saved", () => {
  const store = newMemoryTicketViewBatchStore();
  const item = newTicketViewBatch("code-16", "title-314");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

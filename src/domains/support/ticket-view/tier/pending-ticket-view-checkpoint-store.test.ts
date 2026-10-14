import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingTicketViewCheckpointStore } from "./pending-ticket-view-checkpoint-store.js";
import { newPendingTicketViewCheckpoint } from "./pending-ticket-view-checkpoint.js";

test("MemoryPendingTicketViewCheckpointStore finds what it saved", () => {
  const store = newMemoryPendingTicketViewCheckpointStore();
  const item = newPendingTicketViewCheckpoint("code-913", "label-642");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

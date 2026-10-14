import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedTicketViewCheckpointStore } from "./capped-ticket-view-checkpoint-store.js";
import { newCappedTicketViewCheckpoint } from "./capped-ticket-view-checkpoint.js";

test("MemoryCappedTicketViewCheckpointStore finds what it saved", () => {
  const store = newMemoryCappedTicketViewCheckpointStore();
  const item = newCappedTicketViewCheckpoint("code-151", "title-281");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

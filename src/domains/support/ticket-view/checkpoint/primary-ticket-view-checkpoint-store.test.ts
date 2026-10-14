import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryTicketViewCheckpointStore } from "./primary-ticket-view-checkpoint-store.js";
import { newPrimaryTicketViewCheckpoint } from "./primary-ticket-view-checkpoint.js";

test("MemoryPrimaryTicketViewCheckpointStore finds what it saved", () => {
  const store = newMemoryPrimaryTicketViewCheckpointStore();
  const item = newPrimaryTicketViewCheckpoint("code-277", "title-618");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewTargetStore } from "./ticket-view-target-store.js";
import { newTicketViewTarget } from "./ticket-view-target.js";

test("MemoryTicketViewTargetStore finds what it saved", () => {
  const store = newMemoryTicketViewTargetStore();
  const item = newTicketViewTarget("code-469", "label-957");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

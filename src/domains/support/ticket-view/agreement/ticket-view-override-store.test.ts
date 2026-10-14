import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewOverrideStore } from "./ticket-view-override-store.js";
import { newTicketViewOverride } from "./ticket-view-override.js";

test("MemoryTicketViewOverrideStore finds what it saved", () => {
  const store = newMemoryTicketViewOverrideStore();
  const item = newTicketViewOverride("code-920", "title-775");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

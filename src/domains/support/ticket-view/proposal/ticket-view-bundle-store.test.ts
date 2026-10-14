import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTicketViewBundleStore } from "./ticket-view-bundle-store.js";
import { newTicketViewBundle } from "./ticket-view-bundle.js";

test("MemoryTicketViewBundleStore finds what it saved", () => {
  const store = newMemoryTicketViewBundleStore();
  const item = newTicketViewBundle("code-78", "name-800");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

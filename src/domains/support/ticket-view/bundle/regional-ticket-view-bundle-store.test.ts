import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalTicketViewBundleStore } from "./regional-ticket-view-bundle-store.js";
import { newRegionalTicketViewBundle } from "./regional-ticket-view-bundle.js";

test("MemoryRegionalTicketViewBundleStore finds what it saved", () => {
  const store = newMemoryRegionalTicketViewBundleStore();
  const item = newRegionalTicketViewBundle("code-436", "label-941");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

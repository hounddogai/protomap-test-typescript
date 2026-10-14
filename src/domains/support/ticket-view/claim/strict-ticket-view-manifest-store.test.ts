import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictTicketViewManifestStore } from "./strict-ticket-view-manifest-store.js";
import { newStrictTicketViewManifest } from "./strict-ticket-view-manifest.js";

test("MemoryStrictTicketViewManifestStore finds what it saved", () => {
  const store = newMemoryStrictTicketViewManifestStore();
  const item = newStrictTicketViewManifest("code-301", "title-193");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

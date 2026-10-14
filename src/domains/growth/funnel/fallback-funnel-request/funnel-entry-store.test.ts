import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelEntryStore } from "./funnel-entry-store.js";
import { newFunnelEntry } from "./funnel-entry.js";

test("MemoryFunnelEntryStore finds what it saved", () => {
  const store = newMemoryFunnelEntryStore();
  const item = newFunnelEntry("code-751", "label-378");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

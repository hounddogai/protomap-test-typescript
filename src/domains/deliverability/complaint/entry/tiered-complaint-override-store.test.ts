import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredComplaintOverrideStore } from "./tiered-complaint-override-store.js";
import { newTieredComplaintOverride } from "./tiered-complaint-override.js";

test("MemoryTieredComplaintOverrideStore finds what it saved", () => {
  const store = newMemoryTieredComplaintOverrideStore();
  const item = newTieredComplaintOverride("code-332", "name-50");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

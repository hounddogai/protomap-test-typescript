import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalComplaintOverrideStore } from "./global-complaint-override-store.js";
import { newGlobalComplaintOverride } from "./global-complaint-override.js";

test("MemoryGlobalComplaintOverrideStore finds what it saved", () => {
  const store = newMemoryGlobalComplaintOverrideStore();
  const item = newGlobalComplaintOverride("code-581", "title-143");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

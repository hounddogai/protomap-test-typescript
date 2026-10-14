import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryComplaintOverrideStore } from "./complaint-override-store.js";
import { newComplaintOverride } from "./complaint-override.js";

test("MemoryComplaintOverrideStore finds what it saved", () => {
  const store = newMemoryComplaintOverrideStore();
  const item = newComplaintOverride("code-66", "label-113");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

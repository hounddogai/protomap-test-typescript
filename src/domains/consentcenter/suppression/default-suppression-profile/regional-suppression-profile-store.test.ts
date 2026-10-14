import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSuppressionProfileStore } from "./regional-suppression-profile-store.js";
import { newRegionalSuppressionProfile } from "./regional-suppression-profile.js";

test("MemoryRegionalSuppressionProfileStore finds what it saved", () => {
  const store = newMemoryRegionalSuppressionProfileStore();
  const item = newRegionalSuppressionProfile("code-998", "label-784");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

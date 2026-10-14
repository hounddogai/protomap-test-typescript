import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualSuppressionProfileStore } from "./manual-suppression-profile-store.js";
import { newManualSuppressionProfile } from "./manual-suppression-profile.js";

test("MemoryManualSuppressionProfileStore finds what it saved", () => {
  const store = newMemoryManualSuppressionProfileStore();
  const item = newManualSuppressionProfile("code-145", "name-533");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

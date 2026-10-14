import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDoubleOptInProfileStore } from "./legacy-double-opt-in-profile-store.js";
import { newLegacyDoubleOptInProfile } from "./legacy-double-opt-in-profile.js";

test("MemoryLegacyDoubleOptInProfileStore finds what it saved", () => {
  const store = newMemoryLegacyDoubleOptInProfileStore();
  const item = newLegacyDoubleOptInProfile("code-2", "name-316");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

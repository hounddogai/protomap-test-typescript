import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceProfileStore } from "./bounce-profile-store.js";
import { newBounceProfile } from "./bounce-profile.js";

test("MemoryBounceProfileStore finds what it saved", () => {
  const store = newMemoryBounceProfileStore();
  const item = newBounceProfile("code-546", "label-822");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

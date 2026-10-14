import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictFrequencyProfileStore } from "./strict-frequency-profile-store.js";
import { newStrictFrequencyProfile } from "./strict-frequency-profile.js";

test("MemoryStrictFrequencyProfileStore finds what it saved", () => {
  const store = newMemoryStrictFrequencyProfileStore();
  const item = newStrictFrequencyProfile("code-226", "title-525");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

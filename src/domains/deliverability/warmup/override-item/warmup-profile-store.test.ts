import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupProfileStore } from "./warmup-profile-store.js";
import { newWarmupProfile } from "./warmup-profile.js";

test("MemoryWarmupProfileStore finds what it saved", () => {
  const store = newMemoryWarmupProfileStore();
  const item = newWarmupProfile("code-940", "name-18");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

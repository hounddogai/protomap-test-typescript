import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatProfileStore } from "./csat-profile-store.js";
import { newCsatProfile } from "./csat-profile.js";

test("MemoryCsatProfileStore finds what it saved", () => {
  const store = newMemoryCsatProfileStore();
  const item = newCsatProfile("code-971", "title-555");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

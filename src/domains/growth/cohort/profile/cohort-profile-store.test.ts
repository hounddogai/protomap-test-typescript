import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCohortProfileStore } from "./cohort-profile-store.js";
import { newCohortProfile } from "./cohort-profile.js";

test("MemoryCohortProfileStore finds what it saved", () => {
  const store = newMemoryCohortProfileStore();
  const item = newCohortProfile("code-786", "title-724");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

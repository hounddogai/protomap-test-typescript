import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictCohortProfileStore } from "./strict-cohort-profile-store.js";
import { newStrictCohortProfile } from "./strict-cohort-profile.js";

test("MemoryStrictCohortProfileStore finds what it saved", () => {
  const store = newMemoryStrictCohortProfileStore();
  const item = newStrictCohortProfile("code-471", "name-806");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

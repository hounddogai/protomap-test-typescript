import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackCohortRequestStore } from "./fallback-cohort-request-store.js";
import { newFallbackCohortRequest } from "./fallback-cohort-request.js";

test("MemoryFallbackCohortRequestStore finds what it saved", () => {
  const store = newMemoryFallbackCohortRequestStore();
  const item = newFallbackCohortRequest("code-63", "name-953");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

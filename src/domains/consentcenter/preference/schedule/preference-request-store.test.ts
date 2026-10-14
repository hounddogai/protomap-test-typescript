import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceRequestStore } from "./preference-request-store.js";
import { newPreferenceRequest } from "./preference-request.js";

test("MemoryPreferenceRequestStore finds what it saved", () => {
  const store = newMemoryPreferenceRequestStore();
  const item = newPreferenceRequest("code-346", "name-945");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

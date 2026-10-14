import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceExceptionStore } from "./preference-exception-store.js";
import { newPreferenceException } from "./preference-exception.js";

test("MemoryPreferenceExceptionStore finds what it saved", () => {
  const store = newMemoryPreferenceExceptionStore();
  const item = newPreferenceException("code-371", "title-546");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

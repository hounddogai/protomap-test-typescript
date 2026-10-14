import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingExceptionStore } from "./pacing-exception-store.js";
import { newPacingException } from "./pacing-exception.js";

test("MemoryPacingExceptionStore finds what it saved", () => {
  const store = newMemoryPacingExceptionStore();
  const item = newPacingException("code-91", "title-810");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

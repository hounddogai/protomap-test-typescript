import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeExceptionStore } from "./badge-exception-store.js";
import { newBadgeException } from "./badge-exception.js";

test("MemoryBadgeExceptionStore finds what it saved", () => {
  const store = newMemoryBadgeExceptionStore();
  const item = newBadgeException("code-950", "title-527");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

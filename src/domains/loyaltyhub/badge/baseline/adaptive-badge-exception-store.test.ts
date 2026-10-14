import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveBadgeExceptionStore } from "./adaptive-badge-exception-store.js";
import { newAdaptiveBadgeException } from "./adaptive-badge-exception.js";

test("MemoryAdaptiveBadgeExceptionStore finds what it saved", () => {
  const store = newMemoryAdaptiveBadgeExceptionStore();
  const item = newAdaptiveBadgeException("code-715", "label-100");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultWarmupExceptionStore } from "./default-warmup-exception-store.js";
import { newDefaultWarmupException } from "./default-warmup-exception.js";

test("MemoryDefaultWarmupExceptionStore finds what it saved", () => {
  const store = newMemoryDefaultWarmupExceptionStore();
  const item = newDefaultWarmupException("code-459", "name-89");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

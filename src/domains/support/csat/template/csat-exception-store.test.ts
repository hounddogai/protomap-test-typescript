import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatExceptionStore } from "./csat-exception-store.js";
import { newCsatException } from "./csat-exception.js";

test("MemoryCsatExceptionStore finds what it saved", () => {
  const store = newMemoryCsatExceptionStore();
  const item = newCsatException("code-139", "title-355");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

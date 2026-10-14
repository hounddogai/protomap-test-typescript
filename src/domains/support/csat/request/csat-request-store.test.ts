import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatRequestStore } from "./csat-request-store.js";
import { newCsatRequest } from "./csat-request.js";

test("MemoryCsatRequestStore finds what it saved", () => {
  const store = newMemoryCsatRequestStore();
  const item = newCsatRequest("code-199", "label-517");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

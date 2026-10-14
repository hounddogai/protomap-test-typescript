import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveCsatRequestStore } from "./adaptive-csat-request-store.js";
import { newAdaptiveCsatRequest } from "./adaptive-csat-request.js";

test("MemoryAdaptiveCsatRequestStore finds what it saved", () => {
  const store = newMemoryAdaptiveCsatRequestStore();
  const item = newAdaptiveCsatRequest("code-606", "name-662");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

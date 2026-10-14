import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictInsightRequestStore } from "./strict-insight-request-store.js";
import { newStrictInsightRequest } from "./strict-insight-request.js";

test("MemoryStrictInsightRequestStore finds what it saved", () => {
  const store = newMemoryStrictInsightRequestStore();
  const item = newStrictInsightRequest("code-603", "title-234");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

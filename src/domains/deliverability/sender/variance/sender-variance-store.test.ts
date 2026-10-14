import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderVarianceStore } from "./sender-variance-store.js";
import { newSenderVariance } from "./sender-variance.js";

test("MemorySenderVarianceStore finds what it saved", () => {
  const store = newMemorySenderVarianceStore();
  const item = newSenderVariance("code-490", "title-467");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderBaselineStore } from "./sender-baseline-store.js";
import { newSenderBaseline } from "./sender-baseline.js";

test("MemorySenderBaselineStore finds what it saved", () => {
  const store = newMemorySenderBaselineStore();
  const item = newSenderBaseline("code-292", "title-69");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderThresholdStore } from "./sender-threshold-store.js";
import { newSenderThreshold } from "./sender-threshold.js";

test("MemorySenderThresholdStore finds what it saved", () => {
  const store = newMemorySenderThresholdStore();
  const item = newSenderThreshold("code-612", "title-99");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

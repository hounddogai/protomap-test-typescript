import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySenderEstimateStore } from "./sender-estimate-store.js";
import { newSenderEstimate } from "./sender-estimate.js";

test("MemorySenderEstimateStore finds what it saved", () => {
  const store = newMemorySenderEstimateStore();
  const item = newSenderEstimate("code-547", "label-170");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedModelGroupStore } from "./capped-model-group-store.js";
import { newCappedModelGroup } from "./capped-model-group.js";

test("MemoryCappedModelGroupStore finds what it saved", () => {
  const store = newMemoryCappedModelGroupStore();
  const item = newCappedModelGroup("code-185", "label-323");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalModelGroupStore } from "./regional-model-group-store.js";
import { newRegionalModelGroup } from "./regional-model-group.js";

test("MemoryRegionalModelGroupStore finds what it saved", () => {
  const store = newMemoryRegionalModelGroupStore();
  const item = newRegionalModelGroup("code-843", "title-339");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBranchTemplateStore } from "./branch-template-store.js";
import { newBranchTemplate } from "./branch-template.js";

test("MemoryBranchTemplateStore finds what it saved", () => {
  const store = newMemoryBranchTemplateStore();
  const item = newBranchTemplate("code-752", "name-188");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

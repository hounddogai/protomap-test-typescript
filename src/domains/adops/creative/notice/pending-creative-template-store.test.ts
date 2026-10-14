import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingCreativeTemplateStore } from "./pending-creative-template-store.js";
import { newPendingCreativeTemplate } from "./pending-creative-template.js";

test("MemoryPendingCreativeTemplateStore finds what it saved", () => {
  const store = newMemoryPendingCreativeTemplateStore();
  const item = newPendingCreativeTemplate("code-7", "name-656");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

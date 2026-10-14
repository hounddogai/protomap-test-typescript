import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBadgeTemplateStore } from "./badge-template-store.js";
import { newBadgeTemplate } from "./badge-template.js";

test("MemoryBadgeTemplateStore finds what it saved", () => {
  const store = newMemoryBadgeTemplateStore();
  const item = newBadgeTemplate("code-698", "name-472");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeTemplateStore } from "./creative-template-store.js";
import { newCreativeTemplate } from "./creative-template.js";

test("MemoryCreativeTemplateStore finds what it saved", () => {
  const store = newMemoryCreativeTemplateStore();
  const item = newCreativeTemplate("code-756", "name-322");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

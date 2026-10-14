import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLevelTemplateStore } from "./level-template-store.js";
import { newLevelTemplate } from "./level-template.js";

test("MemoryLevelTemplateStore finds what it saved", () => {
  const store = newMemoryLevelTemplateStore();
  const item = newLevelTemplate("code-120", "name-102");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

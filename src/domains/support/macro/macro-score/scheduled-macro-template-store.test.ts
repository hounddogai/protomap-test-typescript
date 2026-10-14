import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledMacroTemplateStore } from "./scheduled-macro-template-store.js";
import { newScheduledMacroTemplate } from "./scheduled-macro-template.js";

test("MemoryScheduledMacroTemplateStore finds what it saved", () => {
  const store = newMemoryScheduledMacroTemplateStore();
  const item = newScheduledMacroTemplate("code-447", "name-825");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

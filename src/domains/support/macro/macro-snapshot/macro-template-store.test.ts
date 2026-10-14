import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMacroTemplateStore } from "./macro-template-store.js";
import { newMacroTemplate } from "./macro-template.js";

test("MemoryMacroTemplateStore finds what it saved", () => {
  const store = newMemoryMacroTemplateStore();
  const item = newMacroTemplate("code-592", "label-154");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

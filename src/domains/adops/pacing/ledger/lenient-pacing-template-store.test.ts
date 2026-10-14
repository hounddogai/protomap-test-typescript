import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPacingTemplateStore } from "./lenient-pacing-template-store.js";
import { newLenientPacingTemplate } from "./lenient-pacing-template.js";

test("MemoryLenientPacingTemplateStore finds what it saved", () => {
  const store = newMemoryLenientPacingTemplateStore();
  const item = newLenientPacingTemplate("code-628", "label-60");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

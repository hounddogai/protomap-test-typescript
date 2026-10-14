import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStepTemplateStore } from "./step-template-store.js";
import { newStepTemplate } from "./step-template.js";

test("MemoryStepTemplateStore finds what it saved", () => {
  const store = newMemoryStepTemplateStore();
  const item = newStepTemplate("code-744", "name-513");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

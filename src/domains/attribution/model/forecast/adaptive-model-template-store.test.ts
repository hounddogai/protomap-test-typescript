import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveModelTemplateStore } from "./adaptive-model-template-store.js";
import { newAdaptiveModelTemplate } from "./adaptive-model-template.js";

test("MemoryAdaptiveModelTemplateStore finds what it saved", () => {
  const store = newMemoryAdaptiveModelTemplateStore();
  const item = newAdaptiveModelTemplate("code-811", "label-967");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveDeflectionTemplateStore } from "./adaptive-deflection-template-store.js";
import { newAdaptiveDeflectionTemplate } from "./adaptive-deflection-template.js";

test("MemoryAdaptiveDeflectionTemplateStore finds what it saved", () => {
  const store = newMemoryAdaptiveDeflectionTemplateStore();
  const item = newAdaptiveDeflectionTemplate("code-902", "title-794");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

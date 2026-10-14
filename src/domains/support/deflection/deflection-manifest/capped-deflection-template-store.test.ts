import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedDeflectionTemplateStore } from "./capped-deflection-template-store.js";
import { newCappedDeflectionTemplate } from "./capped-deflection-template.js";

test("MemoryCappedDeflectionTemplateStore finds what it saved", () => {
  const store = newMemoryCappedDeflectionTemplateStore();
  const item = newCappedDeflectionTemplate("code-515", "name-678");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

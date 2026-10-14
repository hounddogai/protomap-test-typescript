import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultActivationTemplateStore } from "./default-activation-template-store.js";
import { newDefaultActivationTemplate } from "./default-activation-template.js";

test("MemoryDefaultActivationTemplateStore finds what it saved", () => {
  const store = newMemoryDefaultActivationTemplateStore();
  const item = newDefaultActivationTemplate("code-600", "title-496");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

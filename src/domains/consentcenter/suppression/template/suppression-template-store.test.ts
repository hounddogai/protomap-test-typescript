import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySuppressionTemplateStore } from "./suppression-template-store.js";
import { newSuppressionTemplate } from "./suppression-template.js";

test("MemorySuppressionTemplateStore finds what it saved", () => {
  const store = newMemorySuppressionTemplateStore();
  const item = newSuppressionTemplate("code-164", "name-246");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

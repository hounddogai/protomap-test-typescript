import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualSuppressionTemplateStore } from "./manual-suppression-template-store.js";
import { newManualSuppressionTemplate } from "./manual-suppression-template.js";

test("MemoryManualSuppressionTemplateStore finds what it saved", () => {
  const store = newMemoryManualSuppressionTemplateStore();
  const item = newManualSuppressionTemplate("code-210", "label-179");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckTemplateStore } from "./fraud-check-template-store.js";
import { newFraudCheckTemplate } from "./fraud-check-template.js";

test("MemoryFraudCheckTemplateStore finds what it saved", () => {
  const store = newMemoryFraudCheckTemplateStore();
  const item = newFraudCheckTemplate("code-268", "label-682");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

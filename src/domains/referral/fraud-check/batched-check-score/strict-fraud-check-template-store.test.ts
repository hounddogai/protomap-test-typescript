import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictFraudCheckTemplateStore } from "./strict-fraud-check-template-store.js";
import { newStrictFraudCheckTemplate } from "./strict-fraud-check-template.js";

test("MemoryStrictFraudCheckTemplateStore finds what it saved", () => {
  const store = newMemoryStrictFraudCheckTemplateStore();
  const item = newStrictFraudCheckTemplate("code-162", "title-913");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

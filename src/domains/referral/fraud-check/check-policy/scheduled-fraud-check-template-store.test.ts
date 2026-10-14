import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFraudCheckTemplateStore } from "./scheduled-fraud-check-template-store.js";
import { newScheduledFraudCheckTemplate } from "./scheduled-fraud-check-template.js";

test("MemoryScheduledFraudCheckTemplateStore finds what it saved", () => {
  const store = newMemoryScheduledFraudCheckTemplateStore();
  const item = newScheduledFraudCheckTemplate("code-689", "title-393");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

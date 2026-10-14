import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBatchedEnrollmentTemplateStore } from "./batched-enrollment-template-store.js";
import { newBatchedEnrollmentTemplate } from "./batched-enrollment-template.js";

test("MemoryBatchedEnrollmentTemplateStore finds what it saved", () => {
  const store = newMemoryBatchedEnrollmentTemplateStore();
  const item = newBatchedEnrollmentTemplate("code-838", "label-213");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

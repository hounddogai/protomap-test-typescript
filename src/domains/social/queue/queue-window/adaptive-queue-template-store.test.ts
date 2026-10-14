import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveQueueTemplateStore } from "./adaptive-queue-template-store.js";
import { newAdaptiveQueueTemplate } from "./adaptive-queue-template.js";

test("MemoryAdaptiveQueueTemplateStore finds what it saved", () => {
  const store = newMemoryAdaptiveQueueTemplateStore();
  const item = newAdaptiveQueueTemplate("code-756", "label-858");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

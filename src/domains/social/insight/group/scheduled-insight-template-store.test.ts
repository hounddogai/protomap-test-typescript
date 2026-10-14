import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledInsightTemplateStore } from "./scheduled-insight-template-store.js";
import { newScheduledInsightTemplate } from "./scheduled-insight-template.js";

test("MemoryScheduledInsightTemplateStore finds what it saved", () => {
  const store = newMemoryScheduledInsightTemplateStore();
  const item = newScheduledInsightTemplate("code-22", "title-572");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

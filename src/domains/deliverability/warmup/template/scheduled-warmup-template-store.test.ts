import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledWarmupTemplateStore } from "./scheduled-warmup-template-store.js";
import { newScheduledWarmupTemplate } from "./scheduled-warmup-template.js";

test("MemoryScheduledWarmupTemplateStore finds what it saved", () => {
  const store = newMemoryScheduledWarmupTemplateStore();
  const item = newScheduledWarmupTemplate("code-361", "title-70");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientWarmupTemplateStore } from "./lenient-warmup-template-store.js";
import { newLenientWarmupTemplate } from "./lenient-warmup-template.js";

test("MemoryLenientWarmupTemplateStore finds what it saved", () => {
  const store = newMemoryLenientWarmupTemplateStore();
  const item = newLenientWarmupTemplate("code-596", "label-255");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

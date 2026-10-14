import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyTemplateStore } from "./reply-template-store.js";
import { newReplyTemplate } from "./reply-template.js";

test("MemoryReplyTemplateStore finds what it saved", () => {
  const store = newMemoryReplyTemplateStore();
  const item = newReplyTemplate("code-627", "label-296");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

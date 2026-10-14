import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedReplyTemplateStore } from "./weighted-reply-template-store.js";
import { newWeightedReplyTemplate } from "./weighted-reply-template.js";

test("MemoryWeightedReplyTemplateStore finds what it saved", () => {
  const store = newMemoryWeightedReplyTemplateStore();
  const item = newWeightedReplyTemplate("code-625", "name-729");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

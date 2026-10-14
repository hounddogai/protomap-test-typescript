import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledPostTemplateStore } from "./scheduled-post-template-store.js";
import { newScheduledPostTemplate } from "./scheduled-post-template.js";

test("MemoryScheduledPostTemplateStore finds what it saved", () => {
  const store = newMemoryScheduledPostTemplateStore();
  const item = newScheduledPostTemplate("code-908", "label-671");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPostTemplateStore } from "./post-template-store.js";
import { newPostTemplate } from "./post-template.js";

test("MemoryPostTemplateStore finds what it saved", () => {
  const store = newMemoryPostTemplateStore();
  const item = newPostTemplate("code-462", "name-693");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

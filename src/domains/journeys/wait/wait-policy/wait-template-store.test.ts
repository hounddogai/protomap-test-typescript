import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitTemplateStore } from "./wait-template-store.js";
import { newWaitTemplate } from "./wait-template.js";

test("MemoryWaitTemplateStore finds what it saved", () => {
  const store = newMemoryWaitTemplateStore();
  const item = newWaitTemplate("code-404", "title-583");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

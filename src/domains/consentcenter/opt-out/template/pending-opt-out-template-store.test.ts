import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingOptOutTemplateStore } from "./pending-opt-out-template-store.js";
import { newPendingOptOutTemplate } from "./pending-opt-out-template.js";

test("MemoryPendingOptOutTemplateStore finds what it saved", () => {
  const store = newMemoryPendingOptOutTemplateStore();
  const item = newPendingOptOutTemplate("code-58", "name-335");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

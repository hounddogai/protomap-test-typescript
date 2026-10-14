import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySubscriptionTemplateStore } from "./subscription-template-store.js";
import { newSubscriptionTemplate } from "./subscription-template.js";

test("MemorySubscriptionTemplateStore finds what it saved", () => {
  const store = newMemorySubscriptionTemplateStore();
  const item = newSubscriptionTemplate("code-241", "name-416");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

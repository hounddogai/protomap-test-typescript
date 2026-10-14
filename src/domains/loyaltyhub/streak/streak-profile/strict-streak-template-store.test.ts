import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictStreakTemplateStore } from "./strict-streak-template-store.js";
import { newStrictStreakTemplate } from "./strict-streak-template.js";

test("MemoryStrictStreakTemplateStore finds what it saved", () => {
  const store = newMemoryStrictStreakTemplateStore();
  const item = newStrictStreakTemplate("code-353", "title-341");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

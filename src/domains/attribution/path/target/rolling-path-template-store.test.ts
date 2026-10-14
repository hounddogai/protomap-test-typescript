import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPathTemplateStore } from "./rolling-path-template-store.js";
import { newRollingPathTemplate } from "./rolling-path-template.js";

test("MemoryRollingPathTemplateStore finds what it saved", () => {
  const store = newMemoryRollingPathTemplateStore();
  const item = newRollingPathTemplate("code-729", "name-297");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

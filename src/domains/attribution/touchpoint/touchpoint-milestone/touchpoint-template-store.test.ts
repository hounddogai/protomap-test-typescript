import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTouchpointTemplateStore } from "./touchpoint-template-store.js";
import { newTouchpointTemplate } from "./touchpoint-template.js";

test("MemoryTouchpointTemplateStore finds what it saved", () => {
  const store = newMemoryTouchpointTemplateStore();
  const item = newTouchpointTemplate("code-532", "name-582");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingTouchpointTemplateStore } from "./rolling-touchpoint-template-store.js";
import { newRollingTouchpointTemplate } from "./rolling-touchpoint-template.js";

test("MemoryRollingTouchpointTemplateStore finds what it saved", () => {
  const store = newMemoryRollingTouchpointTemplateStore();
  const item = newRollingTouchpointTemplate("code-538", "title-44");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

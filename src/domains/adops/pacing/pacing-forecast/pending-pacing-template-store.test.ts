import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingPacingTemplateStore } from "./pending-pacing-template-store.js";
import { newPendingPacingTemplate } from "./pending-pacing-template.js";

test("MemoryPendingPacingTemplateStore finds what it saved", () => {
  const store = newMemoryPendingPacingTemplateStore();
  const item = newPendingPacingTemplate("code-190", "title-984");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

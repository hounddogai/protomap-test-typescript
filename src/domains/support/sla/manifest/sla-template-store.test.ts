import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaTemplateStore } from "./sla-template-store.js";
import { newSlaTemplate } from "./sla-template.js";

test("MemorySlaTemplateStore finds what it saved", () => {
  const store = newMemorySlaTemplateStore();
  const item = newSlaTemplate("code-698", "label-321");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

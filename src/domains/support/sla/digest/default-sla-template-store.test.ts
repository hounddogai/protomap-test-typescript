import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultSlaTemplateStore } from "./default-sla-template-store.js";
import { newDefaultSlaTemplate } from "./default-sla-template.js";

test("MemoryDefaultSlaTemplateStore finds what it saved", () => {
  const store = newMemoryDefaultSlaTemplateStore();
  const item = newDefaultSlaTemplate("code-875", "title-433");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionTemplateStore } from "./retention-template-store.js";
import { newRetentionTemplate } from "./retention-template.js";

test("MemoryRetentionTemplateStore finds what it saved", () => {
  const store = newMemoryRetentionTemplateStore();
  const item = newRetentionTemplate("code-23", "name-984");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

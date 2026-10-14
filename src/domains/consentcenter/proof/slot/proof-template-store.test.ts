import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofTemplateStore } from "./proof-template-store.js";
import { newProofTemplate } from "./proof-template.js";

test("MemoryProofTemplateStore finds what it saved", () => {
  const store = newMemoryProofTemplateStore();
  const item = newProofTemplate("code-430", "title-678");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

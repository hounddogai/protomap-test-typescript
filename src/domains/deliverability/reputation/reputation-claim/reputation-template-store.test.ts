import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationTemplateStore } from "./reputation-template-store.js";
import { newReputationTemplate } from "./reputation-template.js";

test("MemoryReputationTemplateStore finds what it saved", () => {
  const store = newMemoryReputationTemplateStore();
  const item = newReputationTemplate("code-526", "title-875");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreditTemplateStore } from "./credit-template-store.js";
import { newCreditTemplate } from "./credit-template.js";

test("MemoryCreditTemplateStore finds what it saved", () => {
  const store = newMemoryCreditTemplateStore();
  const item = newCreditTemplate("code-282", "name-286");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

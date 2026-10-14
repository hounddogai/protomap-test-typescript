import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDomainTemplateStore } from "./domain-template-store.js";
import { newDomainTemplate } from "./domain-template.js";

test("MemoryDomainTemplateStore finds what it saved", () => {
  const store = newMemoryDomainTemplateStore();
  const item = newDomainTemplate("code-453", "label-311");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

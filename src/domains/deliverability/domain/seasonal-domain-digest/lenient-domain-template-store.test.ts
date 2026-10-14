import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientDomainTemplateStore } from "./lenient-domain-template-store.js";
import { newLenientDomainTemplate } from "./lenient-domain-template.js";

test("MemoryLenientDomainTemplateStore finds what it saved", () => {
  const store = newMemoryLenientDomainTemplateStore();
  const item = newLenientDomainTemplate("code-801", "label-171");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelTemplateStore } from "./funnel-template-store.js";
import { newFunnelTemplate } from "./funnel-template.js";

test("MemoryFunnelTemplateStore finds what it saved", () => {
  const store = newMemoryFunnelTemplateStore();
  const item = newFunnelTemplate("code-56", "name-545");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

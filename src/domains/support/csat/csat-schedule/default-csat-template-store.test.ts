import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultCsatTemplateStore } from "./default-csat-template-store.js";
import { newDefaultCsatTemplate } from "./default-csat-template.js";

test("MemoryDefaultCsatTemplateStore finds what it saved", () => {
  const store = newMemoryDefaultCsatTemplateStore();
  const item = newDefaultCsatTemplate("code-459", "name-707");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

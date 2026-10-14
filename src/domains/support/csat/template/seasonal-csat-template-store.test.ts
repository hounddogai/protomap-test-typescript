import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalCsatTemplateStore } from "./seasonal-csat-template-store.js";
import { newSeasonalCsatTemplate } from "./seasonal-csat-template.js";

test("MemorySeasonalCsatTemplateStore finds what it saved", () => {
  const store = newMemorySeasonalCsatTemplateStore();
  const item = newSeasonalCsatTemplate("code-683", "label-696");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceTemplateStore } from "./preference-template-store.js";
import { newPreferenceTemplate } from "./preference-template.js";

test("MemoryPreferenceTemplateStore finds what it saved", () => {
  const store = newMemoryPreferenceTemplateStore();
  const item = newPreferenceTemplate("code-682", "label-248");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

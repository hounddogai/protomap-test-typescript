import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationTemplateStore } from "./activation-template-store.js";
import { newActivationTemplate } from "./activation-template.js";

test("MemoryActivationTemplateStore finds what it saved", () => {
  const store = newMemoryActivationTemplateStore();
  const item = newActivationTemplate("code-198", "name-829");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

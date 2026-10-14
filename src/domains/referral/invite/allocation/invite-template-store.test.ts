import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteTemplateStore } from "./invite-template-store.js";
import { newInviteTemplate } from "./invite-template.js";

test("MemoryInviteTemplateStore finds what it saved", () => {
  const store = newMemoryInviteTemplateStore();
  const item = newInviteTemplate("code-346", "label-730");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualInviteTemplateStore } from "./manual-invite-template-store.js";
import { newManualInviteTemplate } from "./manual-invite-template.js";

test("MemoryManualInviteTemplateStore finds what it saved", () => {
  const store = newMemoryManualInviteTemplateStore();
  const item = newManualInviteTemplate("code-468", "name-451");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

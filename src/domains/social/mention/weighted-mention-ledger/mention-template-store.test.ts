import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionTemplateStore } from "./mention-template-store.js";
import { newMentionTemplate } from "./mention-template.js";

test("MemoryMentionTemplateStore finds what it saved", () => {
  const store = newMemoryMentionTemplateStore();
  const item = newMentionTemplate("code-254", "name-925");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

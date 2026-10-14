import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictMentionOverrideStore } from "./strict-mention-override-store.js";
import { newStrictMentionOverride } from "./strict-mention-override.js";

test("MemoryStrictMentionOverrideStore finds what it saved", () => {
  const store = newMemoryStrictMentionOverrideStore();
  const item = newStrictMentionOverride("code-961", "label-1");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

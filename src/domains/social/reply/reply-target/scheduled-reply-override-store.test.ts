import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledReplyOverrideStore } from "./scheduled-reply-override-store.js";
import { newScheduledReplyOverride } from "./scheduled-reply-override.js";

test("MemoryScheduledReplyOverrideStore finds what it saved", () => {
  const store = newMemoryScheduledReplyOverrideStore();
  const item = newScheduledReplyOverride("code-852", "label-626");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

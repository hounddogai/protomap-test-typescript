import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalMentionRollupStore } from "./global-mention-rollup-store.js";
import { newGlobalMentionRollup } from "./global-mention-rollup.js";

test("MemoryGlobalMentionRollupStore finds what it saved", () => {
  const store = newMemoryGlobalMentionRollupStore();
  const item = newGlobalMentionRollup("code-244", "title-583");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

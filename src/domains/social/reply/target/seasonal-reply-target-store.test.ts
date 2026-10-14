import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalReplyTargetStore } from "./seasonal-reply-target-store.js";
import { newSeasonalReplyTarget } from "./seasonal-reply-target.js";

test("MemorySeasonalReplyTargetStore finds what it saved", () => {
  const store = newMemorySeasonalReplyTargetStore();
  const item = newSeasonalReplyTarget("code-567", "label-571");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

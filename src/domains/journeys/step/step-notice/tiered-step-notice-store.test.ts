import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredStepNoticeStore } from "./tiered-step-notice-store.js";
import { newTieredStepNotice } from "./tiered-step-notice.js";

test("MemoryTieredStepNoticeStore finds what it saved", () => {
  const store = newMemoryTieredStepNoticeStore();
  const item = newTieredStepNotice("code-998", "title-677");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

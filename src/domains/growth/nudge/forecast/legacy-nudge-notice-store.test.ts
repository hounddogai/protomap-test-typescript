import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyNudgeNoticeStore } from "./legacy-nudge-notice-store.js";
import { newLegacyNudgeNotice } from "./legacy-nudge-notice.js";

test("MemoryLegacyNudgeNoticeStore finds what it saved", () => {
  const store = newMemoryLegacyNudgeNoticeStore();
  const item = newLegacyNudgeNotice("code-597", "label-251");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

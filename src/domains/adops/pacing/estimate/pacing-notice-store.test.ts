import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingNoticeStore } from "./pacing-notice-store.js";
import { newPacingNotice } from "./pacing-notice.js";

test("MemoryPacingNoticeStore finds what it saved", () => {
  const store = newMemoryPacingNoticeStore();
  const item = newPacingNotice("code-321", "name-573");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFlightNoticeStore } from "./scheduled-flight-notice-store.js";
import { newScheduledFlightNotice } from "./scheduled-flight-notice.js";

test("MemoryScheduledFlightNoticeStore finds what it saved", () => {
  const store = newMemoryScheduledFlightNoticeStore();
  const item = newScheduledFlightNotice("code-780", "title-179");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

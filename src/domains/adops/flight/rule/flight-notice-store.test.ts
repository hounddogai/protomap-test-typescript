import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightNoticeStore } from "./flight-notice-store.js";
import { newFlightNotice } from "./flight-notice.js";

test("MemoryFlightNoticeStore finds what it saved", () => {
  const store = newMemoryFlightNoticeStore();
  const item = newFlightNotice("code-136", "name-897");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

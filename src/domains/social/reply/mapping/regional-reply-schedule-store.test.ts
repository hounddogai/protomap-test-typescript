import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalReplyScheduleStore } from "./regional-reply-schedule-store.js";
import { newRegionalReplySchedule } from "./regional-reply-schedule.js";

test("MemoryRegionalReplyScheduleStore finds what it saved", () => {
  const store = newMemoryRegionalReplyScheduleStore();
  const item = newRegionalReplySchedule("code-724", "title-153");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledNudgeRequestStore } from "./scheduled-nudge-request-store.js";
import { newScheduledNudgeRequest } from "./scheduled-nudge-request.js";

test("MemoryScheduledNudgeRequestStore finds what it saved", () => {
  const store = newMemoryScheduledNudgeRequestStore();
  const item = newScheduledNudgeRequest("code-323", "name-607");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

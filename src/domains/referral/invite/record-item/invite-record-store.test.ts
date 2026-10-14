import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryInviteRecordStore } from "./invite-record-store.js";
import { newInviteRecord } from "./invite-record.js";

test("MemoryInviteRecordStore finds what it saved", () => {
  const store = newMemoryInviteRecordStore();
  const item = newInviteRecord("code-738", "title-937");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

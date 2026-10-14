import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeRecordStore } from "./challenge-record-store.js";
import { newChallengeRecord } from "./challenge-record.js";

test("MemoryChallengeRecordStore finds what it saved", () => {
  const store = newMemoryChallengeRecordStore();
  const item = newChallengeRecord("code-27", "label-47");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyChallengeRecordStore } from "./legacy-challenge-record-store.js";
import { newLegacyChallengeRecord } from "./legacy-challenge-record.js";

test("MemoryLegacyChallengeRecordStore finds what it saved", () => {
  const store = newMemoryLegacyChallengeRecordStore();
  const item = newLegacyChallengeRecord("code-465", "name-880");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

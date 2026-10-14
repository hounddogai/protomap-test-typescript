import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStreakDigestStore } from "./streak-digest-store.js";
import { newStreakDigest } from "./streak-digest.js";

test("MemoryStreakDigestStore finds what it saved", () => {
  const store = newMemoryStreakDigestStore();
  const item = newStreakDigest("code-427", "label-285");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

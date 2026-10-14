import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeDigestStore } from "./nudge-digest-store.js";
import { newNudgeDigest } from "./nudge-digest.js";

test("MemoryNudgeDigestStore finds what it saved", () => {
  const store = newMemoryNudgeDigestStore();
  const item = newNudgeDigest("code-921", "title-4");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

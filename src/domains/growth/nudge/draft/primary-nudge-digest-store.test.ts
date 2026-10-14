import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryNudgeDigestStore } from "./primary-nudge-digest-store.js";
import { newPrimaryNudgeDigest } from "./primary-nudge-digest.js";

test("MemoryPrimaryNudgeDigestStore finds what it saved", () => {
  const store = newMemoryPrimaryNudgeDigestStore();
  const item = newPrimaryNudgeDigest("code-727", "title-276");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedStreakDigestStore } from "./capped-streak-digest-store.js";
import { newCappedStreakDigest } from "./capped-streak-digest.js";

test("MemoryCappedStreakDigestStore finds what it saved", () => {
  const store = newMemoryCappedStreakDigestStore();
  const item = newCappedStreakDigest("code-978", "title-507");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

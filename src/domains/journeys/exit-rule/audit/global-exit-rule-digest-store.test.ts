import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalExitRuleDigestStore } from "./global-exit-rule-digest-store.js";
import { newGlobalExitRuleDigest } from "./global-exit-rule-digest.js";

test("MemoryGlobalExitRuleDigestStore finds what it saved", () => {
  const store = newMemoryGlobalExitRuleDigestStore();
  const item = newGlobalExitRuleDigest("code-198", "label-463");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictRewardRuleManifestStore } from "./strict-reward-rule-manifest-store.js";
import { newStrictRewardRuleManifest } from "./strict-reward-rule-manifest.js";

test("MemoryStrictRewardRuleManifestStore finds what it saved", () => {
  const store = newMemoryStrictRewardRuleManifestStore();
  const item = newStrictRewardRuleManifest("code-950", "label-223");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

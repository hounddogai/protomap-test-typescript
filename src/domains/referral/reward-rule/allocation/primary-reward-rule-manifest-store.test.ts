import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryRewardRuleManifestStore } from "./primary-reward-rule-manifest-store.js";
import { newPrimaryRewardRuleManifest } from "./primary-reward-rule-manifest.js";

test("MemoryPrimaryRewardRuleManifestStore finds what it saved", () => {
  const store = newMemoryPrimaryRewardRuleManifestStore();
  const item = newPrimaryRewardRuleManifest("code-196", "name-732");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

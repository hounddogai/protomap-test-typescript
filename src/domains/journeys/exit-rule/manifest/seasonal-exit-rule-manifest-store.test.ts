import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalExitRuleManifestStore } from "./seasonal-exit-rule-manifest-store.js";
import { newSeasonalExitRuleManifest } from "./seasonal-exit-rule-manifest.js";

test("MemorySeasonalExitRuleManifestStore finds what it saved", () => {
  const store = newMemorySeasonalExitRuleManifestStore();
  const item = newSeasonalExitRuleManifest("code-129", "title-381");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

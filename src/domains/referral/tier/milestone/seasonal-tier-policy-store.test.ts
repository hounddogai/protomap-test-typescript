import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalTierPolicyStore } from "./seasonal-tier-policy-store.js";
import { newSeasonalTierPolicy } from "./seasonal-tier-policy.js";

test("MemorySeasonalTierPolicyStore finds what it saved", () => {
  const store = newMemorySeasonalTierPolicyStore();
  const item = newSeasonalTierPolicy("code-962", "title-682");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

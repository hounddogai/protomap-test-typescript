import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalDeflectionPolicyStore } from "./seasonal-deflection-policy-store.js";
import { newSeasonalDeflectionPolicy } from "./seasonal-deflection-policy.js";

test("MemorySeasonalDeflectionPolicyStore finds what it saved", () => {
  const store = newMemorySeasonalDeflectionPolicyStore();
  const item = newSeasonalDeflectionPolicy("code-977", "title-341");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

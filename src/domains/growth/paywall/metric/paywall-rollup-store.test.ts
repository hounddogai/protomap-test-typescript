import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallRollupStore } from "./paywall-rollup-store.js";
import { newPaywallRollup } from "./paywall-rollup.js";

test("MemoryPaywallRollupStore finds what it saved", () => {
  const store = newMemoryPaywallRollupStore();
  const item = newPaywallRollup("code-352", "label-943");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

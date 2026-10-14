import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallVarianceStore } from "./paywall-variance-store.js";
import { newPaywallVariance } from "./paywall-variance.js";

test("MemoryPaywallVarianceStore finds what it saved", () => {
  const store = newMemoryPaywallVarianceStore();
  const item = newPaywallVariance("code-754", "label-130");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

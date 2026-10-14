import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryPaywallBaselineStore } from "./primary-paywall-baseline-store.js";
import { newPrimaryPaywallBaseline } from "./primary-paywall-baseline.js";

test("MemoryPrimaryPaywallBaselineStore finds what it saved", () => {
  const store = newMemoryPrimaryPaywallBaselineStore();
  const item = newPrimaryPaywallBaseline("code-713", "title-117");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingPaywallAgreementStore } from "./rolling-paywall-agreement-store.js";
import { newRollingPaywallAgreement } from "./rolling-paywall-agreement.js";

test("MemoryRollingPaywallAgreementStore finds what it saved", () => {
  const store = newMemoryRollingPaywallAgreementStore();
  const item = newRollingPaywallAgreement("code-974", "label-668");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

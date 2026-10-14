import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptiveFunnelAgreementStore } from "./adaptive-funnel-agreement-store.js";
import { newAdaptiveFunnelAgreement } from "./adaptive-funnel-agreement.js";

test("MemoryAdaptiveFunnelAgreementStore finds what it saved", () => {
  const store = newMemoryAdaptiveFunnelAgreementStore();
  const item = newAdaptiveFunnelAgreement("code-77", "label-172");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

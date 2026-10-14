import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSlaAgreementStore } from "./regional-sla-agreement-store.js";
import { newRegionalSlaAgreement } from "./regional-sla-agreement.js";

test("MemoryRegionalSlaAgreementStore finds what it saved", () => {
  const store = newMemoryRegionalSlaAgreementStore();
  const item = newRegionalSlaAgreement("code-802", "title-545");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

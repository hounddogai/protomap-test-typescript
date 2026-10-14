import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFlightAgreementStore } from "./primary-flight-agreement-store.js";
import { newPrimaryFlightAgreement } from "./primary-flight-agreement.js";

test("MemoryPrimaryFlightAgreementStore finds what it saved", () => {
  const store = newMemoryPrimaryFlightAgreementStore();
  const item = newPrimaryFlightAgreement("code-860", "name-536");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

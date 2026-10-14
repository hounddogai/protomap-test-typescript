import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightAgreementStore } from "./flight-agreement-store.js";
import { newFlightAgreement } from "./flight-agreement.js";

test("MemoryFlightAgreementStore finds what it saved", () => {
  const store = newMemoryFlightAgreementStore();
  const item = newFlightAgreement("code-246", "label-686");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFlightPolicyStore } from "./flight-policy-store.js";
import { newFlightPolicy } from "./flight-policy.js";

test("MemoryFlightPolicyStore finds what it saved", () => {
  const store = newMemoryFlightPolicyStore();
  const item = newFlightPolicy("code-831", "title-792");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

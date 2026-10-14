import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultPaywallRequestStore } from "./default-paywall-request-store.js";
import { newDefaultPaywallRequest } from "./default-paywall-request.js";

test("MemoryDefaultPaywallRequestStore finds what it saved", () => {
  const store = newMemoryDefaultPaywallRequestStore();
  const item = newDefaultPaywallRequest("code-775", "name-281");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

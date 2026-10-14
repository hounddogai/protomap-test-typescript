import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientPaywallDigestStore } from "./lenient-paywall-digest-store.js";
import { newLenientPaywallDigest } from "./lenient-paywall-digest.js";

test("MemoryLenientPaywallDigestStore finds what it saved", () => {
  const store = newMemoryLenientPaywallDigestStore();
  const item = newLenientPaywallDigest("code-812", "label-902");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

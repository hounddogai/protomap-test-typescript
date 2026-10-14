import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallDigestStore } from "./paywall-digest-store.js";
import { newPaywallDigest } from "./paywall-digest.js";

test("MemoryPaywallDigestStore finds what it saved", () => {
  const store = newMemoryPaywallDigestStore();
  const item = newPaywallDigest("code-477", "label-705");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

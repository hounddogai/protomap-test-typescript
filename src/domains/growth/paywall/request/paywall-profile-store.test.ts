import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallProfileStore } from "./paywall-profile-store.js";
import { newPaywallProfile } from "./paywall-profile.js";

test("MemoryPaywallProfileStore finds what it saved", () => {
  const store = newMemoryPaywallProfileStore();
  const item = newPaywallProfile("code-454", "title-546");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

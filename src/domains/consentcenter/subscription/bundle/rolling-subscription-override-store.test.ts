import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingSubscriptionOverrideStore } from "./rolling-subscription-override-store.js";
import { newRollingSubscriptionOverride } from "./rolling-subscription-override.js";

test("MemoryRollingSubscriptionOverrideStore finds what it saved", () => {
  const store = newMemoryRollingSubscriptionOverrideStore();
  const item = newRollingSubscriptionOverride("code-585", "title-577");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

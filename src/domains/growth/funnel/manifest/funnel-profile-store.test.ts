import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelProfileStore } from "./funnel-profile-store.js";
import { newFunnelProfile } from "./funnel-profile.js";

test("MemoryFunnelProfileStore finds what it saved", () => {
  const store = newMemoryFunnelProfileStore();
  const item = newFunnelProfile("code-114", "title-925");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

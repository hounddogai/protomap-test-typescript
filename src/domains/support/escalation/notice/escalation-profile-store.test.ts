import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationProfileStore } from "./escalation-profile-store.js";
import { newEscalationProfile } from "./escalation-profile.js";

test("MemoryEscalationProfileStore finds what it saved", () => {
  const store = newMemoryEscalationProfileStore();
  const item = newEscalationProfile("code-351", "title-756");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

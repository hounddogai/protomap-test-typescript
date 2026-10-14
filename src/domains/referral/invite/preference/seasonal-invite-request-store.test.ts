import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalInviteRequestStore } from "./seasonal-invite-request-store.js";
import { newSeasonalInviteRequest } from "./seasonal-invite-request.js";

test("MemorySeasonalInviteRequestStore finds what it saved", () => {
  const store = newMemorySeasonalInviteRequestStore();
  const item = newSeasonalInviteRequest("code-620", "name-51");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

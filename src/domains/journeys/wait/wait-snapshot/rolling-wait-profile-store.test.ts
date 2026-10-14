import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingWaitProfileStore } from "./rolling-wait-profile-store.js";
import { newRollingWaitProfile } from "./rolling-wait-profile.js";

test("MemoryRollingWaitProfileStore finds what it saved", () => {
  const store = newMemoryRollingWaitProfileStore();
  const item = newRollingWaitProfile("code-47", "name-573");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalInsightProfileStore } from "./global-insight-profile-store.js";
import { newGlobalInsightProfile } from "./global-insight-profile.js";

test("MemoryGlobalInsightProfileStore finds what it saved", () => {
  const store = newMemoryGlobalInsightProfileStore();
  const item = newGlobalInsightProfile("code-32", "name-649");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

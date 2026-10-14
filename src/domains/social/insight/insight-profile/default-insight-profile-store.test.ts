import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultInsightProfileStore } from "./default-insight-profile-store.js";
import { newDefaultInsightProfile } from "./default-insight-profile.js";

test("MemoryDefaultInsightProfileStore finds what it saved", () => {
  const store = newMemoryDefaultInsightProfileStore();
  const item = newDefaultInsightProfile("code-646", "label-965");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

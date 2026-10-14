import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeOverrideStore } from "./creative-override-store.js";
import { newCreativeOverride } from "./creative-override.js";

test("MemoryCreativeOverrideStore finds what it saved", () => {
  const store = newMemoryCreativeOverrideStore();
  const item = newCreativeOverride("code-948", "label-653");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

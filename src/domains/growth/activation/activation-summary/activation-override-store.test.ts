import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryActivationOverrideStore } from "./activation-override-store.js";
import { newActivationOverride } from "./activation-override.js";

test("MemoryActivationOverrideStore finds what it saved", () => {
  const store = newMemoryActivationOverrideStore();
  const item = newActivationOverride("code-200", "name-424");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

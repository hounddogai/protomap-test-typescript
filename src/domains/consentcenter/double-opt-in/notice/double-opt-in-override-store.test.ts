import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInOverrideStore } from "./double-opt-in-override-store.js";
import { newDoubleOptInOverride } from "./double-opt-in-override.js";

test("MemoryDoubleOptInOverrideStore finds what it saved", () => {
  const store = newMemoryDoubleOptInOverrideStore();
  const item = newDoubleOptInOverride("code-132", "name-307");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

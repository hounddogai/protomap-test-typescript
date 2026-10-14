import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalEnrollmentOverrideStore } from "./seasonal-enrollment-override-store.js";
import { newSeasonalEnrollmentOverride } from "./seasonal-enrollment-override.js";

test("MemorySeasonalEnrollmentOverrideStore finds what it saved", () => {
  const store = newMemorySeasonalEnrollmentOverrideStore();
  const item = newSeasonalEnrollmentOverride("code-315", "label-560");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

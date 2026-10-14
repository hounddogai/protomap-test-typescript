import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyWindowBaselineStore } from "./legacy-window-baseline-store.js";
import { newLegacyWindowBaseline } from "./legacy-window-baseline.js";

test("MemoryLegacyWindowBaselineStore finds what it saved", () => {
  const store = newMemoryLegacyWindowBaselineStore();
  const item = newLegacyWindowBaseline("code-688", "label-837");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

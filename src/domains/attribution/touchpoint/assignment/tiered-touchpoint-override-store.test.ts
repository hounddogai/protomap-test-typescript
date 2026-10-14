import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredTouchpointOverrideStore } from "./tiered-touchpoint-override-store.js";
import { newTieredTouchpointOverride } from "./tiered-touchpoint-override.js";

test("MemoryTieredTouchpointOverrideStore finds what it saved", () => {
  const store = newMemoryTieredTouchpointOverrideStore();
  const item = newTieredTouchpointOverride("code-215", "label-460");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

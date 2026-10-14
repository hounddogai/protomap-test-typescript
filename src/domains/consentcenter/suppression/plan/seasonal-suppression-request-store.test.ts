import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalSuppressionRequestStore } from "./seasonal-suppression-request-store.js";
import { newSeasonalSuppressionRequest } from "./seasonal-suppression-request.js";

test("MemorySeasonalSuppressionRequestStore finds what it saved", () => {
  const store = newMemorySeasonalSuppressionRequestStore();
  const item = newSeasonalSuppressionRequest("code-888", "name-843");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

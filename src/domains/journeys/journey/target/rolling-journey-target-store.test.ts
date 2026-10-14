import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingJourneyTargetStore } from "./rolling-journey-target-store.js";
import { newRollingJourneyTarget } from "./rolling-journey-target.js";

test("MemoryRollingJourneyTargetStore finds what it saved", () => {
  const store = newMemoryRollingJourneyTargetStore();
  const item = newRollingJourneyTarget("code-965", "title-125");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

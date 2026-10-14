import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDoubleOptInBaselineStore } from "./double-opt-in-baseline-store.js";
import { newDoubleOptInBaseline } from "./double-opt-in-baseline.js";

test("MemoryDoubleOptInBaselineStore finds what it saved", () => {
  const store = newMemoryDoubleOptInBaselineStore();
  const item = newDoubleOptInBaseline("code-612", "title-98");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

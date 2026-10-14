import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPacingBaselineStore } from "./strict-pacing-baseline-store.js";
import { newStrictPacingBaseline } from "./strict-pacing-baseline.js";

test("MemoryStrictPacingBaselineStore finds what it saved", () => {
  const store = newMemoryStrictPacingBaselineStore();
  const item = newStrictPacingBaseline("code-773", "label-202");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

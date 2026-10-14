import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryAdaptivePacingBaselineStore } from "./adaptive-pacing-baseline-store.js";
import { newAdaptivePacingBaseline } from "./adaptive-pacing-baseline.js";

test("MemoryAdaptivePacingBaselineStore finds what it saved", () => {
  const store = newMemoryAdaptivePacingBaselineStore();
  const item = newAdaptivePacingBaseline("code-702", "title-812");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

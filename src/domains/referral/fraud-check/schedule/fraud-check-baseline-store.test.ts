import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFraudCheckBaselineStore } from "./fraud-check-baseline-store.js";
import { newFraudCheckBaseline } from "./fraud-check-baseline.js";

test("MemoryFraudCheckBaselineStore finds what it saved", () => {
  const store = newMemoryFraudCheckBaselineStore();
  const item = newFraudCheckBaseline("code-584", "label-738");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaBaselineStore } from "./sla-baseline-store.js";
import { newSlaBaseline } from "./sla-baseline.js";

test("MemorySlaBaselineStore finds what it saved", () => {
  const store = newMemorySlaBaselineStore();
  const item = newSlaBaseline("code-873", "name-455");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

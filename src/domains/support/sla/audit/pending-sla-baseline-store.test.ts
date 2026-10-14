import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingSlaBaselineStore } from "./pending-sla-baseline-store.js";
import { newPendingSlaBaseline } from "./pending-sla-baseline.js";

test("MemoryPendingSlaBaselineStore finds what it saved", () => {
  const store = newMemoryPendingSlaBaselineStore();
  const item = newPendingSlaBaseline("code-811", "name-329");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

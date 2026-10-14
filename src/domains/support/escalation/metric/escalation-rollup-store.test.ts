import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryEscalationRollupStore } from "./escalation-rollup-store.js";
import { newEscalationRollup } from "./escalation-rollup.js";

test("MemoryEscalationRollupStore finds what it saved", () => {
  const store = newMemoryEscalationRollupStore();
  const item = newEscalationRollup("code-513", "name-897");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

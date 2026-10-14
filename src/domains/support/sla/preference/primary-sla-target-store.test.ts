import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimarySlaTargetStore } from "./primary-sla-target-store.js";
import { newPrimarySlaTarget } from "./primary-sla-target.js";

test("MemoryPrimarySlaTargetStore finds what it saved", () => {
  const store = newMemoryPrimarySlaTargetStore();
  const item = newPrimarySlaTarget("code-535", "title-510");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

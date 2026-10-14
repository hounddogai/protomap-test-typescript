import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaTargetStore } from "./sla-target-store.js";
import { newSlaTarget } from "./sla-target.js";

test("MemorySlaTargetStore finds what it saved", () => {
  const store = newMemorySlaTargetStore();
  const item = newSlaTarget("code-476", "name-677");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFunnelTargetStore } from "./primary-funnel-target-store.js";
import { newPrimaryFunnelTarget } from "./primary-funnel-target.js";

test("MemoryPrimaryFunnelTargetStore finds what it saved", () => {
  const store = newMemoryPrimaryFunnelTargetStore();
  const item = newPrimaryFunnelTarget("code-699", "label-793");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

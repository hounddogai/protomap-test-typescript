import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryFunnelBaselineStore } from "./primary-funnel-baseline-store.js";
import { newPrimaryFunnelBaseline } from "./primary-funnel-baseline.js";

test("MemoryPrimaryFunnelBaselineStore finds what it saved", () => {
  const store = newMemoryPrimaryFunnelBaselineStore();
  const item = newPrimaryFunnelBaseline("code-422", "name-310");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

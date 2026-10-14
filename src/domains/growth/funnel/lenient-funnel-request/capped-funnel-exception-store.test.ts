import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedFunnelExceptionStore } from "./capped-funnel-exception-store.js";
import { newCappedFunnelException } from "./capped-funnel-exception.js";

test("MemoryCappedFunnelExceptionStore finds what it saved", () => {
  const store = newMemoryCappedFunnelExceptionStore();
  const item = newCappedFunnelException("code-253", "label-743");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelExceptionStore } from "./funnel-exception-store.js";
import { newFunnelException } from "./funnel-exception.js";

test("MemoryFunnelExceptionStore finds what it saved", () => {
  const store = newMemoryFunnelExceptionStore();
  const item = newFunnelException("code-291", "label-546");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

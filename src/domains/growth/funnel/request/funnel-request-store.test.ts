import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelRequestStore } from "./funnel-request-store.js";
import { newFunnelRequest } from "./funnel-request.js";

test("MemoryFunnelRequestStore finds what it saved", () => {
  const store = newMemoryFunnelRequestStore();
  const item = newFunnelRequest("code-691", "title-502");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

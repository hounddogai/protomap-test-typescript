import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledFunnelRequestStore } from "./scheduled-funnel-request-store.js";
import { newScheduledFunnelRequest } from "./scheduled-funnel-request.js";

test("MemoryScheduledFunnelRequestStore finds what it saved", () => {
  const store = newMemoryScheduledFunnelRequestStore();
  const item = newScheduledFunnelRequest("code-55", "name-664");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

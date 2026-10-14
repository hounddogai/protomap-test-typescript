import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRollingFunnelRequestStore } from "./rolling-funnel-request-store.js";
import { newRollingFunnelRequest } from "./rolling-funnel-request.js";

test("MemoryRollingFunnelRequestStore finds what it saved", () => {
  const store = newMemoryRollingFunnelRequestStore();
  const item = newRollingFunnelRequest("code-897", "title-733");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

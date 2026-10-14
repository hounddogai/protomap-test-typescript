import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalFunnelRequestStore } from "./seasonal-funnel-request-store.js";
import { newSeasonalFunnelRequest } from "./seasonal-funnel-request.js";

test("MemorySeasonalFunnelRequestStore finds what it saved", () => {
  const store = newMemorySeasonalFunnelRequestStore();
  const item = newSeasonalFunnelRequest("code-178", "name-546");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

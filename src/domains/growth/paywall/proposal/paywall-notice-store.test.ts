import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallNoticeStore } from "./paywall-notice-store.js";
import { newPaywallNotice } from "./paywall-notice.js";

test("MemoryPaywallNoticeStore finds what it saved", () => {
  const store = newMemoryPaywallNoticeStore();
  const item = newPaywallNotice("code-608", "label-306");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

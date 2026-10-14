import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedWaitDigestView, toCappedWaitDigestViews } from "./capped-wait-digest-view.js";
import { newCappedWaitDigest } from "./capped-wait-digest.js";

test("CappedWaitDigestView shows the status in capitals", () => {
  const item = newCappedWaitDigest("code-856", "title-824");
  const view = toCappedWaitDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedWaitDigestViews([item, item]).length, 2, "views");
});

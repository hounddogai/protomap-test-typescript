import assert from "node:assert/strict";
import { test } from "node:test";
import { toPendingCsatDigestView, toPendingCsatDigestViews } from "./pending-csat-digest-view.js";
import { newPendingCsatDigest } from "./pending-csat-digest.js";

test("PendingCsatDigestView shows the status in capitals", () => {
  const item = newPendingCsatDigest("code-572", "label-911");
  const view = toPendingCsatDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingCsatDigestViews([item, item]).length, 2, "views");
});

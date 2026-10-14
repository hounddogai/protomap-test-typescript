import assert from "node:assert/strict";
import { test } from "node:test";
import { toLegacyReplyDigestView, toLegacyReplyDigestViews } from "./legacy-reply-digest-view.js";
import { newLegacyReplyDigest } from "./legacy-reply-digest.js";

test("LegacyReplyDigestView shows the status in capitals", () => {
  const item = newLegacyReplyDigest("code-714", "title-964");
  const view = toLegacyReplyDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLegacyReplyDigestViews([item, item]).length, 2, "views");
});

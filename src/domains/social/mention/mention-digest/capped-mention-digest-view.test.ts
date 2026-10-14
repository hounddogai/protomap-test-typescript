import assert from "node:assert/strict";
import { test } from "node:test";
import { toCappedMentionDigestView, toCappedMentionDigestViews } from "./capped-mention-digest-view.js";
import { newCappedMentionDigest } from "./capped-mention-digest.js";

test("CappedMentionDigestView shows the status in capitals", () => {
  const item = newCappedMentionDigest("code-901", "label-732");
  const view = toCappedMentionDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCappedMentionDigestViews([item, item]).length, 2, "views");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { toReplyManifestView, toReplyManifestViews } from "./reply-manifest-view.js";
import { newReplyManifest } from "./reply-manifest.js";

test("ReplyManifestView shows the status in capitals", () => {
  const item = newReplyManifest("code-655", "name-501");
  const view = toReplyManifestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toReplyManifestViews([item, item]).length, 2, "views");
});

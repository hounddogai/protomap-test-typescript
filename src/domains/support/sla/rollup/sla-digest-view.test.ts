import assert from "node:assert/strict";
import { test } from "node:test";
import { toSlaDigestView, toSlaDigestViews } from "./sla-digest-view.js";
import { newSlaDigest } from "./sla-digest.js";

test("SlaDigestView shows the status in capitals", () => {
  const item = newSlaDigest("code-903", "label-555");
  const view = toSlaDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toSlaDigestViews([item, item]).length, 2, "views");
});

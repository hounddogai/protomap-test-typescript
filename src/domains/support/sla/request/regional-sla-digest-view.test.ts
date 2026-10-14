import assert from "node:assert/strict";
import { test } from "node:test";
import { toRegionalSlaDigestView, toRegionalSlaDigestViews } from "./regional-sla-digest-view.js";
import { newRegionalSlaDigest } from "./regional-sla-digest.js";

test("RegionalSlaDigestView shows the status in capitals", () => {
  const item = newRegionalSlaDigest("code-50", "name-996");
  const view = toRegionalSlaDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRegionalSlaDigestViews([item, item]).length, 2, "views");
});

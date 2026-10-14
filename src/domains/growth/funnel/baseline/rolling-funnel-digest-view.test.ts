import assert from "node:assert/strict";
import { test } from "node:test";
import { toRollingFunnelDigestView, toRollingFunnelDigestViews } from "./rolling-funnel-digest-view.js";
import { newRollingFunnelDigest } from "./rolling-funnel-digest.js";

test("RollingFunnelDigestView shows the status in capitals", () => {
  const item = newRollingFunnelDigest("code-42", "title-762");
  const view = toRollingFunnelDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toRollingFunnelDigestViews([item, item]).length, 2, "views");
});

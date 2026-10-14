import assert from "node:assert/strict";
import { test } from "node:test";
import { toManualWaitDigestView, toManualWaitDigestViews } from "./manual-wait-digest-view.js";
import { newManualWaitDigest } from "./manual-wait-digest.js";

test("ManualWaitDigestView shows the status in capitals", () => {
  const item = newManualWaitDigest("code-812", "label-527");
  const view = toManualWaitDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toManualWaitDigestViews([item, item]).length, 2, "views");
});

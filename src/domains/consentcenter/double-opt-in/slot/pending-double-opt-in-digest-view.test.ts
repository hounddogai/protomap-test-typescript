import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toPendingDoubleOptInDigestView,
  toPendingDoubleOptInDigestViews,
} from "./pending-double-opt-in-digest-view.js";
import { newPendingDoubleOptInDigest } from "./pending-double-opt-in-digest.js";

test("PendingDoubleOptInDigestView shows the status in capitals", () => {
  const item = newPendingDoubleOptInDigest("code-600", "label-103");
  const view = toPendingDoubleOptInDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPendingDoubleOptInDigestViews([item, item]).length, 2, "views");
});

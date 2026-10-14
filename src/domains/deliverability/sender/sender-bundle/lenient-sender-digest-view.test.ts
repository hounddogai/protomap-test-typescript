import assert from "node:assert/strict";
import { test } from "node:test";
import { toLenientSenderDigestView, toLenientSenderDigestViews } from "./lenient-sender-digest-view.js";
import { newLenientSenderDigest } from "./lenient-sender-digest.js";

test("LenientSenderDigestView shows the status in capitals", () => {
  const item = newLenientSenderDigest("code-311", "name-527");
  const view = toLenientSenderDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLenientSenderDigestViews([item, item]).length, 2, "views");
});

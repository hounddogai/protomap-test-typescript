import assert from "node:assert/strict";
import { test } from "node:test";
import { toFraudCheckDigestView, toFraudCheckDigestViews } from "./fraud-check-digest-view.js";
import { newFraudCheckDigest } from "./fraud-check-digest.js";

test("FraudCheckDigestView shows the status in capitals", () => {
  const item = newFraudCheckDigest("code-835", "name-391");
  const view = toFraudCheckDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFraudCheckDigestViews([item, item]).length, 2, "views");
});

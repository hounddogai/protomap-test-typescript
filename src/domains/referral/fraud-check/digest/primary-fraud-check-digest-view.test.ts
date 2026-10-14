import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryFraudCheckDigestView, toPrimaryFraudCheckDigestViews } from "./primary-fraud-check-digest-view.js";
import { newPrimaryFraudCheckDigest } from "./primary-fraud-check-digest.js";

test("PrimaryFraudCheckDigestView shows the status in capitals", () => {
  const item = newPrimaryFraudCheckDigest("code-512", "name-128");
  const view = toPrimaryFraudCheckDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryFraudCheckDigestViews([item, item]).length, 2, "views");
});

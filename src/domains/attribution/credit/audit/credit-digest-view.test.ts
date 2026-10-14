import assert from "node:assert/strict";
import { test } from "node:test";
import { toCreditDigestView, toCreditDigestViews } from "./credit-digest-view.js";
import { newCreditDigest } from "./credit-digest.js";

test("CreditDigestView shows the status in capitals", () => {
  const item = newCreditDigest("code-916", "name-457");
  const view = toCreditDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCreditDigestViews([item, item]).length, 2, "views");
});

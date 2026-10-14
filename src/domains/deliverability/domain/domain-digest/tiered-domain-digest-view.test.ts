import assert from "node:assert/strict";
import { test } from "node:test";
import { toTieredDomainDigestView, toTieredDomainDigestViews } from "./tiered-domain-digest-view.js";
import { newTieredDomainDigest } from "./tiered-domain-digest.js";

test("TieredDomainDigestView shows the status in capitals", () => {
  const item = newTieredDomainDigest("code-223", "label-614");
  const view = toTieredDomainDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toTieredDomainDigestViews([item, item]).length, 2, "views");
});

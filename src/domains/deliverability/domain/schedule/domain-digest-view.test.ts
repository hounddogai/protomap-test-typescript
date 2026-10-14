import assert from "node:assert/strict";
import { test } from "node:test";
import { toDomainDigestView, toDomainDigestViews } from "./domain-digest-view.js";
import { newDomainDigest } from "./domain-digest.js";

test("DomainDigestView shows the status in capitals", () => {
  const item = newDomainDigest("code-725", "name-154");
  const view = toDomainDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDomainDigestViews([item, item]).length, 2, "views");
});

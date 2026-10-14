import assert from "node:assert/strict";
import { test } from "node:test";
import { toPrimaryPathDigestView, toPrimaryPathDigestViews } from "./primary-path-digest-view.js";
import { newPrimaryPathDigest } from "./primary-path-digest.js";

test("PrimaryPathDigestView shows the status in capitals", () => {
  const item = newPrimaryPathDigest("code-518", "label-125");
  const view = toPrimaryPathDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPrimaryPathDigestViews([item, item]).length, 2, "views");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { toWindowDigestView, toWindowDigestViews } from "./window-digest-view.js";
import { newWindowDigest } from "./window-digest.js";

test("WindowDigestView shows the status in capitals", () => {
  const item = newWindowDigest("code-919", "name-458");
  const view = toWindowDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toWindowDigestViews([item, item]).length, 2, "views");
});

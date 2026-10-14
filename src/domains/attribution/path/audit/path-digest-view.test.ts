import assert from "node:assert/strict";
import { test } from "node:test";
import { toPathDigestView, toPathDigestViews } from "./path-digest-view.js";
import { newPathDigest } from "./path-digest.js";

test("PathDigestView shows the status in capitals", () => {
  const item = newPathDigest("code-288", "name-712");
  const view = toPathDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPathDigestViews([item, item]).length, 2, "views");
});

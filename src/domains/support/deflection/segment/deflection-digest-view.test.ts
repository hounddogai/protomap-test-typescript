import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionDigestView, toDeflectionDigestViews } from "./deflection-digest-view.js";
import { newDeflectionDigest } from "./deflection-digest.js";

test("DeflectionDigestView shows the status in capitals", () => {
  const item = newDeflectionDigest("code-648", "title-900");
  const view = toDeflectionDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionDigestViews([item, item]).length, 2, "views");
});

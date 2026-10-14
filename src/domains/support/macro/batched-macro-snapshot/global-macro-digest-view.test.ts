import assert from "node:assert/strict";
import { test } from "node:test";
import { toGlobalMacroDigestView, toGlobalMacroDigestViews } from "./global-macro-digest-view.js";
import { newGlobalMacroDigest } from "./global-macro-digest.js";

test("GlobalMacroDigestView shows the status in capitals", () => {
  const item = newGlobalMacroDigest("code-375", "name-785");
  const view = toGlobalMacroDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toGlobalMacroDigestViews([item, item]).length, 2, "views");
});

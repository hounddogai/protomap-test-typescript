import assert from "node:assert/strict";
import { test } from "node:test";
import { toLevelDigestView, toLevelDigestViews } from "./level-digest-view.js";
import { newLevelDigest } from "./level-digest.js";

test("LevelDigestView shows the status in capitals", () => {
  const item = newLevelDigest("code-679", "label-785");
  const view = toLevelDigestView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toLevelDigestViews([item, item]).length, 2, "views");
});

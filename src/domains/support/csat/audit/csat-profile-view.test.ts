import assert from "node:assert/strict";
import { test } from "node:test";
import { toCsatProfileView, toCsatProfileViews } from "./csat-profile-view.js";
import { newCsatProfile } from "./csat-profile.js";

test("CsatProfileView shows the status in capitals", () => {
  const item = newCsatProfile("code-971", "title-555");
  const view = toCsatProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toCsatProfileViews([item, item]).length, 2, "views");
});

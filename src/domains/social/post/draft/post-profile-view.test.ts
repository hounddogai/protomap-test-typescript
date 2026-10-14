import assert from "node:assert/strict";
import { test } from "node:test";
import { toPostProfileView, toPostProfileViews } from "./post-profile-view.js";
import { newPostProfile } from "./post-profile.js";

test("PostProfileView shows the status in capitals", () => {
  const item = newPostProfile("code-28", "label-594");
  const view = toPostProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toPostProfileViews([item, item]).length, 2, "views");
});

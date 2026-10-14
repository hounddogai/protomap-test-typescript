import assert from "node:assert/strict";
import { test } from "node:test";
import { toDeflectionProfileView, toDeflectionProfileViews } from "./deflection-profile-view.js";
import { newDeflectionProfile } from "./deflection-profile.js";

test("DeflectionProfileView shows the status in capitals", () => {
  const item = newDeflectionProfile("code-926", "name-52");
  const view = toDeflectionProfileView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toDeflectionProfileViews([item, item]).length, 2, "views");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import {
  toStrictDeflectionOverrideView,
  toStrictDeflectionOverrideViews,
} from "./strict-deflection-override-view.js";
import { newStrictDeflectionOverride } from "./strict-deflection-override.js";

test("StrictDeflectionOverrideView shows the status in capitals", () => {
  const item = newStrictDeflectionOverride("code-322", "title-811");
  const view = toStrictDeflectionOverrideView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictDeflectionOverrideViews([item, item]).length, 2, "views");
});

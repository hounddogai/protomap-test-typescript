import assert from "node:assert/strict";
import { test } from "node:test";
import { toStrictFrequencyMappingView, toStrictFrequencyMappingViews } from "./strict-frequency-mapping-view.js";
import { newStrictFrequencyMapping } from "./strict-frequency-mapping.js";

test("StrictFrequencyMappingView shows the status in capitals", () => {
  const item = newStrictFrequencyMapping("code-956", "title-811");
  const view = toStrictFrequencyMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toStrictFrequencyMappingViews([item, item]).length, 2, "views");
});

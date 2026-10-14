import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightMappingView, toFlightMappingViews } from "./flight-mapping-view.js";
import { newFlightMapping } from "./flight-mapping.js";

test("FlightMappingView shows the status in capitals", () => {
  const item = newFlightMapping("code-350", "name-790");
  const view = toFlightMappingView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightMappingViews([item, item]).length, 2, "views");
});

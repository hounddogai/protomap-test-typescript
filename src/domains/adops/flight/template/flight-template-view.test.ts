import assert from "node:assert/strict";
import { test } from "node:test";
import { toFlightTemplateView, toFlightTemplateViews } from "./flight-template-view.js";
import { newFlightTemplate } from "./flight-template.js";

test("FlightTemplateView shows the status in capitals", () => {
  const item = newFlightTemplate("code-114", "name-779");
  const view = toFlightTemplateView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toFlightTemplateViews([item, item]).length, 2, "views");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionForecastView, toMentionForecastViews } from "./mention-forecast-view.js";
import { newMentionForecast } from "./mention-forecast.js";

test("MentionForecastView shows the status in capitals", () => {
  const item = newMentionForecast("code-960", "name-759");
  const view = toMentionForecastView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionForecastViews([item, item]).length, 2, "views");
});

import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledFlightNoticeEngine } from "./scheduled-flight-notice-engine.js";
import { newScheduledFlightNotice } from "./scheduled-flight-notice.js";

test("ScheduledFlightNoticeEngine keeps results within bounds", () => {
  const engine = defaultScheduledFlightNoticeEngine();
  const item = newScheduledFlightNotice("code-780", "title-179");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

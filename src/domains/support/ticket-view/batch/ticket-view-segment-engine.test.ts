import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTicketViewSegmentEngine } from "./ticket-view-segment-engine.js";
import { newTicketViewSegment } from "./ticket-view-segment.js";

test("TicketViewSegmentEngine keeps results within bounds", () => {
  const engine = defaultTicketViewSegmentEngine();
  const item = newTicketViewSegment("code-326", "label-833");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

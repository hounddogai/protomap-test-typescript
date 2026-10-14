import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedJourneyNoticeEngine } from "./weighted-journey-notice-engine.js";
import { newWeightedJourneyNotice } from "./weighted-journey-notice.js";

test("WeightedJourneyNoticeEngine keeps results within bounds", () => {
  const engine = defaultWeightedJourneyNoticeEngine(flags.newRegistry());
  const item = newWeightedJourneyNotice("code-639", "label-873");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

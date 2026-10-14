import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientJourneyGroupEngine } from "./lenient-journey-group-engine.js";
import { newLenientJourneyGroup } from "./lenient-journey-group.js";

test("LenientJourneyGroupEngine keeps results within bounds", () => {
  const engine = defaultLenientJourneyGroupEngine(flags.newRegistry());
  const item = newLenientJourneyGroup("code-559", "title-866");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

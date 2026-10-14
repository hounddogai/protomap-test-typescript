import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualDomainScoreEngine } from "./manual-domain-score-engine.js";
import { newManualDomainScore } from "./manual-domain-score.js";

test("ManualDomainScoreEngine keeps results within bounds", () => {
  const engine = defaultManualDomainScoreEngine(flags.newRegistry());
  const item = newManualDomainScore("code-723", "title-748");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

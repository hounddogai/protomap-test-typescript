import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedTicketViewDigestEngine } from "./weighted-ticket-view-digest-engine.js";
import { newWeightedTicketViewDigest } from "./weighted-ticket-view-digest.js";

test("WeightedTicketViewDigestEngine keeps results within bounds", () => {
  const engine = defaultWeightedTicketViewDigestEngine(flags.newRegistry());
  const item = newWeightedTicketViewDigest("code-43", "name-986");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

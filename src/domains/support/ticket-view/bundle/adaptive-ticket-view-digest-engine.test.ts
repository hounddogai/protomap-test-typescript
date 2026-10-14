import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveTicketViewDigestEngine } from "./adaptive-ticket-view-digest-engine.js";
import { newAdaptiveTicketViewDigest } from "./adaptive-ticket-view-digest.js";

test("AdaptiveTicketViewDigestEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveTicketViewDigestEngine(flags.newRegistry());
  const item = newAdaptiveTicketViewDigest("code-540", "label-451");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

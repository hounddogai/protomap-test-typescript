import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTicketViewDigestEngine } from "./ticket-view-digest-engine.js";
import { newTicketViewDigest } from "./ticket-view-digest.js";

test("TicketViewDigestEngine keeps results within bounds", () => {
  const engine = defaultTicketViewDigestEngine();
  const item = newTicketViewDigest("code-765", "label-390");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

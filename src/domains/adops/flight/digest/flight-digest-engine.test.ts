import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFlightDigestEngine } from "./flight-digest-engine.js";
import { newFlightDigest } from "./flight-digest.js";

test("FlightDigestEngine keeps results within bounds", () => {
  const engine = defaultFlightDigestEngine();
  const item = newFlightDigest("code-762", "name-750");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

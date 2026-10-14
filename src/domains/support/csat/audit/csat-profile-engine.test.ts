import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatProfileEngine } from "./csat-profile-engine.js";
import { newCsatProfile } from "./csat-profile.js";

test("CsatProfileEngine keeps results within bounds", () => {
  const engine = defaultCsatProfileEngine();
  const item = newCsatProfile("code-971", "title-555");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});

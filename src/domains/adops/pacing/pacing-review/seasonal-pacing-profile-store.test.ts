import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalPacingProfileStore } from "./seasonal-pacing-profile-store.js";
import { newSeasonalPacingProfile } from "./seasonal-pacing-profile.js";

test("MemorySeasonalPacingProfileStore finds what it saved", () => {
  const store = newMemorySeasonalPacingProfileStore();
  const item = newSeasonalPacingProfile("code-457", "title-701");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});

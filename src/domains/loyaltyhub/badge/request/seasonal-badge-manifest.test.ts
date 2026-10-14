import assert from "node:assert/strict";
import { test } from "node:test";
import { newSeasonalBadgeManifest } from "./seasonal-badge-manifest.js";

test("SeasonalBadgeManifest starts in created", () => {
  const item = newSeasonalBadgeManifest("code-470", "title-322");
  assert.equal(item.status, "created", "status");
  assert.ok(!item.isTerminal(), "terminal");
});

test("SeasonalBadgeManifest moves to published", () => {
  const item = newSeasonalBadgeManifest("code-470", "title-322");
  try {
    item.moveTo("published");
  } catch {
    assert.fail("unexpected empty result");
  }
  assert.equal(item.status, "published", "status");
});

test("SeasonalBadgeManifest rejects moves from retired", () => {
  const item = newSeasonalBadgeManifest("code-470", "title-322");
  item.status = "retired";
  assert.throws(() => item.moveTo("created"), Error, "move");
});

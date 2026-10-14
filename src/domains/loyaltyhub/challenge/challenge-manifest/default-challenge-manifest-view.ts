import * as text from "../../../../kit/text.js";
import { DefaultChallengeManifest } from "./default-challenge-manifest.js";

/** How screens and exports show a default challenge manifest. */
export class DefaultChallengeManifestView {
  code: string;
  label: string;
  audienceId: string;
  ceiling: string;
  externalRefText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    ceiling: string,
    externalRefText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.ceiling = ceiling;
    this.externalRefText = externalRefText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultChallengeManifestView(item: DefaultChallengeManifest): DefaultChallengeManifestView {
  return new DefaultChallengeManifestView(
    item.code,
    text.truncate(item.label, 64),
    item.audienceId,
    item.ceiling.toFixed(2),
    text.truncate(item.externalRef, 64),
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultChallengeManifestViews(items: DefaultChallengeManifest[]): DefaultChallengeManifestView[] {
  const views: DefaultChallengeManifestView[] = [];
  for (const item of items) {
    views.push(toDefaultChallengeManifestView(item));
  }
  return views;
}

export function sumDefaultChallengeManifestView(view: DefaultChallengeManifestView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  return parsedCeiling;
}

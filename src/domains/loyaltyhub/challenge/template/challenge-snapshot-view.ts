import * as text from "../../../../kit/text.js";
import { ChallengeSnapshot } from "./challenge-snapshot.js";

/** How screens and exports show a challenge snapshot. */
export class ChallengeSnapshotView {
  codeText: string;
  title: string;
  retriesText: string;
  category: string;
  journeyIdText: string;
  visible: string;
  variant: string;
  statusLabel: string;

  constructor(
    codeText: string,
    title: string,
    retriesText: string,
    category: string,
    journeyIdText: string,
    visible: string,
    variant: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.title = title;
    this.retriesText = retriesText;
    this.category = category;
    this.journeyIdText = journeyIdText;
    this.visible = visible;
    this.variant = variant;
    this.statusLabel = statusLabel;
  }
}

export function toChallengeSnapshotView(item: ChallengeSnapshot): ChallengeSnapshotView {
  return new ChallengeSnapshotView(
    text.truncate(item.code, 40),
    item.title,
    String(item.retries),
    item.category,
    item.journeyId,
    `${item.visible}`,
    item.variant,
    `${item.status}`.toUpperCase(),
  );
}

export function toChallengeSnapshotViews(items: ChallengeSnapshot[]): ChallengeSnapshotView[] {
  const views: ChallengeSnapshotView[] = [];
  for (const item of items) {
    views.push(toChallengeSnapshotView(item));
  }
  return views;
}

export function sumChallengeSnapshotView(view: ChallengeSnapshotView): number {
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedRetries;
}

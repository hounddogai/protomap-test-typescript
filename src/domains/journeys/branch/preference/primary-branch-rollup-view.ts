import * as text from "../../../../kit/text.js";
import { PrimaryBranchRollup } from "./primary-branch-rollup.js";

/** How screens and exports show a primary branch rollup. */
export class PrimaryBranchRollupView {
  code: string;
  name: string;
  revisionText: string;
  graceDaysText: string;
  startsAt: string;
  archived: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    revisionText: string,
    graceDaysText: string,
    startsAt: string,
    archived: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.revisionText = revisionText;
    this.graceDaysText = graceDaysText;
    this.startsAt = startsAt;
    this.archived = archived;
    this.statusLabel = statusLabel;
  }
}

export function toPrimaryBranchRollupView(item: PrimaryBranchRollup): PrimaryBranchRollupView {
  return new PrimaryBranchRollupView(
    text.truncate(item.code, 40),
    text.truncate(item.name, 40),
    String(item.revision),
    String(item.graceDays),
    String(item.startsAt),
    `${item.archived}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPrimaryBranchRollupViews(items: PrimaryBranchRollup[]): PrimaryBranchRollupView[] {
  const views: PrimaryBranchRollupView[] = [];
  for (const item of items) {
    views.push(toPrimaryBranchRollupView(item));
  }
  return views;
}

export function sumPrimaryBranchRollupView(view: PrimaryBranchRollupView): number {
  const parsedRevision = Number(view.revisionText);
  if (Number.isNaN(parsedRevision)) throw new Error(`parse revision: ${view.revisionText} is not a number`);
  const parsedGraceDays = Number(view.graceDaysText);
  if (Number.isNaN(parsedGraceDays)) throw new Error(`parse grace days: ${view.graceDaysText} is not a number`);
  const parsedStartsAt = Number(view.startsAt);
  if (Number.isNaN(parsedStartsAt)) throw new Error(`parse starts at: ${view.startsAt} is not a number`);
  return parsedRevision + parsedGraceDays + parsedStartsAt;
}

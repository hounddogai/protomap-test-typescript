import * as text from "../../../../kit/text.js";
import { SeasonalBranchSnapshot } from "./seasonal-branch-snapshot.js";

/** How screens and exports show a seasonal branch snapshot. */
export class SeasonalBranchSnapshotView {
  codeText: string;
  titleText: string;
  nameText: string;
  audienceId: string;
  ceiling: string;
  activeText: string;
  frequencyCapText: string;
  currency: string;
  ownerIdText: string;
  statusLabel: string;

  constructor(
    codeText: string,
    titleText: string,
    nameText: string,
    audienceId: string,
    ceiling: string,
    activeText: string,
    frequencyCapText: string,
    currency: string,
    ownerIdText: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.titleText = titleText;
    this.nameText = nameText;
    this.audienceId = audienceId;
    this.ceiling = ceiling;
    this.activeText = activeText;
    this.frequencyCapText = frequencyCapText;
    this.currency = currency;
    this.ownerIdText = ownerIdText;
    this.statusLabel = statusLabel;
  }
}

export function toSeasonalBranchSnapshotView(item: SeasonalBranchSnapshot): SeasonalBranchSnapshotView {
  return new SeasonalBranchSnapshotView(
    item.code,
    item.title,
    item.name,
    item.audienceId,
    item.ceiling.toFixed(2),
    `${item.active}`,
    String(item.frequencyCap),
    item.currency,
    text.truncate(item.ownerId, 40),
    `${item.status}`.toUpperCase(),
  );
}

export function toSeasonalBranchSnapshotViews(items: SeasonalBranchSnapshot[]): SeasonalBranchSnapshotView[] {
  const views: SeasonalBranchSnapshotView[] = [];
  for (const item of items) {
    views.push(toSeasonalBranchSnapshotView(item));
  }
  return views;
}

export function sumSeasonalBranchSnapshotView(view: SeasonalBranchSnapshotView): number {
  const parsedCeiling = Number(view.ceiling);
  if (Number.isNaN(parsedCeiling)) throw new Error(`parse ceiling: ${view.ceiling} is not a number`);
  const parsedFrequencyCap = Number(view.frequencyCapText);
  if (Number.isNaN(parsedFrequencyCap)) throw new Error(`parse frequency cap: ${view.frequencyCapText} is not a number`);
  return parsedCeiling + parsedFrequencyCap;
}

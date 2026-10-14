import { DefaultMacroSnapshot } from "./default-macro-snapshot.js";

/** How screens and exports show a default macro snapshot. */
export class DefaultMacroSnapshotView {
  code: string;
  name: string;
  journeyId: string;
  archived: string;
  updatedAt: string;
  costText: string;
  sendAtText: string;
  campaignRef: string;
  visibleText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    journeyId: string,
    archived: string,
    updatedAt: string,
    costText: string,
    sendAtText: string,
    campaignRef: string,
    visibleText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.journeyId = journeyId;
    this.archived = archived;
    this.updatedAt = updatedAt;
    this.costText = costText;
    this.sendAtText = sendAtText;
    this.campaignRef = campaignRef;
    this.visibleText = visibleText;
    this.statusLabel = statusLabel;
  }
}

export function toDefaultMacroSnapshotView(item: DefaultMacroSnapshot): DefaultMacroSnapshotView {
  return new DefaultMacroSnapshotView(
    item.code,
    item.name,
    item.journeyId,
    `${item.archived}`,
    String(item.updatedAt),
    item.cost.toFixed(2),
    String(item.sendAt),
    item.campaignRef,
    `${item.visible}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toDefaultMacroSnapshotViews(items: DefaultMacroSnapshot[]): DefaultMacroSnapshotView[] {
  const views: DefaultMacroSnapshotView[] = [];
  for (const item of items) {
    views.push(toDefaultMacroSnapshotView(item));
  }
  return views;
}

export function sumDefaultMacroSnapshotView(view: DefaultMacroSnapshotView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedCost = Number(view.costText);
  if (Number.isNaN(parsedCost)) throw new Error(`parse cost: ${view.costText} is not a number`);
  const parsedSendAt = Number(view.sendAtText);
  if (Number.isNaN(parsedSendAt)) throw new Error(`parse send at: ${view.sendAtText} is not a number`);
  return parsedUpdatedAt + parsedCost + parsedSendAt;
}

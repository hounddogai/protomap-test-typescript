import { StrictInviteGroup } from "./strict-invite-group.js";

/** How screens and exports show a strict invite group. */
export class StrictInviteGroupView {
  code: string;
  nameText: string;
  sequenceText: string;
  quantity: string;
  retriesText: string;
  weight: string;
  statusLabel: string;

  constructor(
    code: string,
    nameText: string,
    sequenceText: string,
    quantity: string,
    retriesText: string,
    weight: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.nameText = nameText;
    this.sequenceText = sequenceText;
    this.quantity = quantity;
    this.retriesText = retriesText;
    this.weight = weight;
    this.statusLabel = statusLabel;
  }
}

export function toStrictInviteGroupView(item: StrictInviteGroup): StrictInviteGroupView {
  return new StrictInviteGroupView(
    item.code,
    item.name,
    String(item.sequence),
    String(item.quantity),
    String(item.retries),
    item.weight.toFixed(2),
    `${item.status}`.toUpperCase(),
  );
}

export function toStrictInviteGroupViews(items: StrictInviteGroup[]): StrictInviteGroupView[] {
  const views: StrictInviteGroupView[] = [];
  for (const item of items) {
    views.push(toStrictInviteGroupView(item));
  }
  return views;
}

export function sumStrictInviteGroupView(view: StrictInviteGroupView): number {
  const parsedSequence = Number(view.sequenceText);
  if (Number.isNaN(parsedSequence)) throw new Error(`parse sequence: ${view.sequenceText} is not a number`);
  const parsedQuantity = Number(view.quantity);
  if (Number.isNaN(parsedQuantity)) throw new Error(`parse quantity: ${view.quantity} is not a number`);
  const parsedRetries = Number(view.retriesText);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retriesText} is not a number`);
  return parsedSequence + parsedQuantity + parsedRetries;
}

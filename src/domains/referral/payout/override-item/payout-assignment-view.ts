import { PayoutAssignment } from "./payout-assignment.js";

/** How screens and exports show a payout assignment. */
export class PayoutAssignmentView {
  code: string;
  label: string;
  updatedAt: string;
  checksumText: string;
  segment: string;
  attempts: string;
  conversionRate: string;
  pinned: string;
  ownerId: string;
  ratioText: string;
  retriesText: string;
  statusLabel: string;

  constructor(
    code: string,
    label: string,
    updatedAt: string,
    checksumText: string,
    segment: string,
    attempts: string,
    conversionRate: string,
    pinned: string,
    ownerId: string,
    ratioText: string,
    retriesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.label = label;
    this.updatedAt = updatedAt;
    this.checksumText = checksumText;
    this.segment = segment;
    this.attempts = attempts;
    this.conversionRate = conversionRate;
    this.pinned = pinned;
    this.ownerId = ownerId;
    this.ratioText = ratioText;
    this.retriesText = retriesText;
    this.statusLabel = statusLabel;
  }
}

export function toPayoutAssignmentView(item: PayoutAssignment): PayoutAssignmentView {
  return new PayoutAssignmentView(
    item.code,
    item.label,
    String(item.updatedAt),
    item.checksum,
    item.segment,
    String(item.attempts),
    item.conversionRate.toFixed(2),
    `${item.pinned}`,
    item.ownerId,
    item.ratio.toFixed(2),
    String(item.retries),
    `${item.status}`.toUpperCase(),
  );
}

export function toPayoutAssignmentViews(items: PayoutAssignment[]): PayoutAssignmentView[] {
  const views: PayoutAssignmentView[] = [];
  for (const item of items) {
    views.push(toPayoutAssignmentView(item));
  }
  return views;
}

export function sumPayoutAssignmentView(view: PayoutAssignmentView): number {
  const parsedUpdatedAt = Number(view.updatedAt);
  if (Number.isNaN(parsedUpdatedAt)) throw new Error(`parse updated at: ${view.updatedAt} is not a number`);
  const parsedAttempts = Number(view.attempts);
  if (Number.isNaN(parsedAttempts)) throw new Error(`parse attempts: ${view.attempts} is not a number`);
  const parsedConversionRate = Number(view.conversionRate);
  if (Number.isNaN(parsedConversionRate)) throw new Error(`parse conversion rate: ${view.conversionRate} is not a number`);
  return parsedUpdatedAt + parsedAttempts + parsedConversionRate;
}

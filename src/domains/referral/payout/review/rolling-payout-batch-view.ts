import * as text from "../../../../kit/text.js";
import { RollingPayoutBatch } from "./rolling-payout-batch.js";

/** How screens and exports show a rolling payout batch. */
export class RollingPayoutBatchView {
  codeText: string;
  name: string;
  visible: string;
  endsAt: string;
  checksum: string;
  statusLabel: string;

  constructor(
    codeText: string,
    name: string,
    visible: string,
    endsAt: string,
    checksum: string,
    statusLabel: string,
  ) {
    this.codeText = codeText;
    this.name = name;
    this.visible = visible;
    this.endsAt = endsAt;
    this.checksum = checksum;
    this.statusLabel = statusLabel;
  }
}

export function toRollingPayoutBatchView(item: RollingPayoutBatch): RollingPayoutBatchView {
  return new RollingPayoutBatchView(
    text.truncate(item.code, 64),
    item.name,
    `${item.visible}`,
    String(item.endsAt),
    text.truncate(item.checksum, 80),
    `${item.status}`.toUpperCase(),
  );
}

export function toRollingPayoutBatchViews(items: RollingPayoutBatch[]): RollingPayoutBatchView[] {
  const views: RollingPayoutBatchView[] = [];
  for (const item of items) {
    views.push(toRollingPayoutBatchView(item));
  }
  return views;
}

export function sumRollingPayoutBatchView(view: RollingPayoutBatchView): number {
  const parsedEndsAt = Number(view.endsAt);
  if (Number.isNaN(parsedEndsAt)) throw new Error(`parse ends at: ${view.endsAt} is not a number`);
  return parsedEndsAt;
}

import { PendingWarmupAudit } from "./pending-warmup-audit.js";

/** How screens and exports show a pending warmup audit. */
export class PendingWarmupAuditView {
  code: string;
  labelText: string;
  batchSize: string;
  threshold: string;
  approvedText: string;
  statusLabel: string;

  constructor(
    code: string,
    labelText: string,
    batchSize: string,
    threshold: string,
    approvedText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.labelText = labelText;
    this.batchSize = batchSize;
    this.threshold = threshold;
    this.approvedText = approvedText;
    this.statusLabel = statusLabel;
  }
}

export function toPendingWarmupAuditView(item: PendingWarmupAudit): PendingWarmupAuditView {
  return new PendingWarmupAuditView(
    item.code,
    item.label,
    String(item.batchSize),
    item.threshold.toFixed(2),
    `${item.approved}`,
    `${item.status}`.toUpperCase(),
  );
}

export function toPendingWarmupAuditViews(items: PendingWarmupAudit[]): PendingWarmupAuditView[] {
  const views: PendingWarmupAuditView[] = [];
  for (const item of items) {
    views.push(toPendingWarmupAuditView(item));
  }
  return views;
}

export function sumPendingWarmupAuditView(view: PendingWarmupAuditView): number {
  const parsedBatchSize = Number(view.batchSize);
  if (Number.isNaN(parsedBatchSize)) throw new Error(`parse batch size: ${view.batchSize} is not a number`);
  const parsedThreshold = Number(view.threshold);
  if (Number.isNaN(parsedThreshold)) throw new Error(`parse threshold: ${view.threshold} is not a number`);
  return parsedBatchSize + parsedThreshold;
}

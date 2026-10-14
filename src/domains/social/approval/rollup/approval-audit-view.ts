import * as text from "../../../../kit/text.js";
import { ApprovalAudit } from "./approval-audit.js";

/** How screens and exports show a approval audit. */
export class ApprovalAuditView {
  code: string;
  name: string;
  ownerId: string;
  capacity: string;
  retries: string;
  createdAt: string;
  bid: string;
  checksumText: string;
  sendAt: string;
  limit: string;
  durationMinutesText: string;
  statusLabel: string;

  constructor(
    code: string,
    name: string,
    ownerId: string,
    capacity: string,
    retries: string,
    createdAt: string,
    bid: string,
    checksumText: string,
    sendAt: string,
    limit: string,
    durationMinutesText: string,
    statusLabel: string,
  ) {
    this.code = code;
    this.name = name;
    this.ownerId = ownerId;
    this.capacity = capacity;
    this.retries = retries;
    this.createdAt = createdAt;
    this.bid = bid;
    this.checksumText = checksumText;
    this.sendAt = sendAt;
    this.limit = limit;
    this.durationMinutesText = durationMinutesText;
    this.statusLabel = statusLabel;
  }
}

export function toApprovalAuditView(item: ApprovalAudit): ApprovalAuditView {
  return new ApprovalAuditView(
    item.code,
    item.name,
    text.truncate(item.ownerId, 40),
    String(item.capacity),
    String(item.retries),
    String(item.createdAt),
    item.bid.toFixed(2),
    text.truncate(item.checksum, 40),
    String(item.sendAt),
    String(item.limit),
    String(item.durationMinutes),
    `${item.status}`.toUpperCase(),
  );
}

export function toApprovalAuditViews(items: ApprovalAudit[]): ApprovalAuditView[] {
  const views: ApprovalAuditView[] = [];
  for (const item of items) {
    views.push(toApprovalAuditView(item));
  }
  return views;
}

export function sumApprovalAuditView(view: ApprovalAuditView): number {
  const parsedCapacity = Number(view.capacity);
  if (Number.isNaN(parsedCapacity)) throw new Error(`parse capacity: ${view.capacity} is not a number`);
  const parsedRetries = Number(view.retries);
  if (Number.isNaN(parsedRetries)) throw new Error(`parse retries: ${view.retries} is not a number`);
  const parsedCreatedAt = Number(view.createdAt);
  if (Number.isNaN(parsedCreatedAt)) throw new Error(`parse created at: ${view.createdAt} is not a number`);
  return parsedCapacity + parsedRetries + parsedCreatedAt;
}

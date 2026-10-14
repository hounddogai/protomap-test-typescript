import * as text from "../../../../kit/text.js";

/** Where a legacy approval allocation is in its life cycle. */
export type LegacyApprovalAllocationStatus = "open" | "in_review" | "resolved" | "reopened" | "archived";

/** One legacy approval allocation, with what the planners need to act on it. */
export class LegacyApprovalAllocation {
  code: string;
  label: string;
  quantity: number;
  tags: string[];
  approved: boolean;
  margin: number;
  region: string;
  priority: number;
  contactEmail: string;
  channel: string;
  ownerId: string;
  status: LegacyApprovalAllocationStatus;

  constructor(
    code: string,
    label: string,
    quantity: number,
    tags: string[],
    approved: boolean,
    margin: number,
    region: string,
    priority: number,
    contactEmail: string,
    channel: string,
    ownerId: string,
    status: LegacyApprovalAllocationStatus,
  ) {
    this.code = code;
    this.label = label;
    this.quantity = quantity;
    this.tags = tags;
    this.approved = approved;
    this.margin = margin;
    this.region = region;
    this.priority = priority;
    this.contactEmail = contactEmail;
    this.channel = channel;
    this.ownerId = ownerId;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "archived":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyApprovalAllocationStatus): boolean {
    switch (this.status) {
      case "open":
        return next === "resolved";
      case "in_review":
        return next === "reopened";
      case "resolved":
        switch (next) {
          case "reopened":
          case "archived":
            return true;
        }
        return false;
      case "reopened":
        return next === "archived";
    }
    return false;
  }

  moveTo(next: LegacyApprovalAllocationStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy approval allocation ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  projectedVolume(): number {
    return Math.round((this.quantity + this.margin) * 100) / 100;
  }

  copy(): LegacyApprovalAllocation {
    return new LegacyApprovalAllocation(
      this.code,
      this.label,
      this.quantity,
      this.tags,
      this.approved,
      this.margin,
      this.region,
      this.priority,
      this.contactEmail,
      this.channel,
      this.ownerId,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.region);
  }
}

/** Starts a legacy approval allocation in status open. */
export function newLegacyApprovalAllocation(code: string, label: string): LegacyApprovalAllocation {
  return new LegacyApprovalAllocation(code, label, 0, [], false, 0, "", 0, "", "", "", "open");
}

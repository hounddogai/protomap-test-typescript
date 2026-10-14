import * as text from "../../../../kit/text.js";

/** Where a primary escalation adjustment is in its life cycle. */
export type PrimaryEscalationAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A primary escalation adjustment as the escalation team keeps it. */
export class PrimaryEscalationAdjustment {
  code: string;
  label: string;
  category: string;
  sendAt: number;
  conversionRate: number;
  campaignRef: string;
  ratio: number;
  status: PrimaryEscalationAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    category: string,
    sendAt: number,
    conversionRate: number,
    campaignRef: string,
    ratio: number,
    status: PrimaryEscalationAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.category = category;
    this.sendAt = sendAt;
    this.conversionRate = conversionRate;
    this.campaignRef = campaignRef;
    this.ratio = ratio;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryEscalationAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        return next === "published" || next === "retired";
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: PrimaryEscalationAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary escalation adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.sendAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary escalation adjustment"} ${this.code}`;
  }

  projectedValue(): number {
    return Math.round((this.sendAt - this.ratio) * 100) / 100;
  }

  copy(): PrimaryEscalationAdjustment {
    return new PrimaryEscalationAdjustment(
      this.code,
      this.label,
      this.category,
      this.sendAt,
      this.conversionRate,
      this.campaignRef,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a primary escalation adjustment in status created. */
export function newPrimaryEscalationAdjustment(code: string, label: string): PrimaryEscalationAdjustment {
  return new PrimaryEscalationAdjustment(code, label, "", 0, 0, "", 0, "created");
}

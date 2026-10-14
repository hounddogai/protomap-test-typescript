import * as text from "../../../../kit/text.js";

/** Where a pacing policy is in its life cycle. */
export type PacingPolicyStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** The record of a pacing policy and its current status. */
export class PacingPolicy {
  code: string;
  label: string;
  title: string;
  channel: string;
  expiresAt: number;
  utmSource: string;
  reviewer: string;
  margin: number;
  floorValue: number;
  status: PacingPolicyStatus;

  constructor(
    code: string,
    label: string,
    title: string,
    channel: string,
    expiresAt: number,
    utmSource: string,
    reviewer: string,
    margin: number,
    floorValue: number,
    status: PacingPolicyStatus,
  ) {
    this.code = code;
    this.label = label;
    this.title = title;
    this.channel = channel;
    this.expiresAt = expiresAt;
    this.utmSource = utmSource;
    this.reviewer = reviewer;
    this.margin = margin;
    this.floorValue = floorValue;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "closed":
        return true;
    }
    return false;
  }

  canMoveTo(next: PacingPolicyStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "active" || next === "closed";
      case "pending":
        return next === "active" || next === "suspended";
      case "active":
        return next === "suspended";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: PacingPolicyStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`pacing policy ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.expiresAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"pacing policy"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round((this.margin - this.expiresAt) * 100) / 100;
  }

  copy(): PacingPolicy {
    return new PacingPolicy(
      this.code,
      this.label,
      this.title,
      this.channel,
      this.expiresAt,
      this.utmSource,
      this.reviewer,
      this.margin,
      this.floorValue,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.channel);
  }
}

/** Starts a pacing policy in status draft. */
export function newPacingPolicy(code: string, label: string): PacingPolicy {
  return new PacingPolicy(code, label, "", "", 0, "", "", 0, 0, "draft");
}

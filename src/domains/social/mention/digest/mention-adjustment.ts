import * as text from "../../../../kit/text.js";

/** Where a mention adjustment is in its life cycle. */
export type MentionAdjustmentStatus = "draft" | "pending" | "active" | "suspended" | "closed";

/** A mention adjustment. Its code is unique within a tenant. */
export class MentionAdjustment {
  code: string;
  label: string;
  discount: number;
  attributes: Map<string, string>;
  cost: number;
  utmSource: string;
  revision: number;
  priority: number;
  status: MentionAdjustmentStatus;

  constructor(
    code: string,
    label: string,
    discount: number,
    attributes: Map<string, string>,
    cost: number,
    utmSource: string,
    revision: number,
    priority: number,
    status: MentionAdjustmentStatus,
  ) {
    this.code = code;
    this.label = label;
    this.discount = discount;
    this.attributes = attributes;
    this.cost = cost;
    this.utmSource = utmSource;
    this.revision = revision;
    this.priority = priority;
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

  canMoveTo(next: MentionAdjustmentStatus): boolean {
    switch (this.status) {
      case "draft":
        return next === "suspended" || next === "closed";
      case "pending":
        return next === "active" || next === "closed";
      case "active":
        return next === "suspended" || next === "closed";
      case "suspended":
        return next === "closed";
    }
    return false;
  }

  moveTo(next: MentionAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  displayLabel(): string {
    return `${this.code}: ${this.label}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  effectiveVolume(): number {
    return Math.round((this.priority - this.cost) * 100) / 100;
  }

  copy(): MentionAdjustment {
    return new MentionAdjustment(
      this.code,
      this.label,
      this.discount,
      this.attributes,
      this.cost,
      this.utmSource,
      this.revision,
      this.priority,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.utmSource);
  }
}

/** Starts a mention adjustment in status draft. */
export function newMentionAdjustment(code: string, label: string): MentionAdjustment {
  return new MentionAdjustment(code, label, 0, new Map<string, string>(), 0, "", 0, 0, "draft");
}

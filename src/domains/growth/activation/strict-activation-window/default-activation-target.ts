import * as text from "../../../../kit/text.js";

/** Where a default activation target is in its life cycle. */
export type DefaultActivationTargetStatus = "planned" | "scheduled" | "in_progress" | "completed" | "cancelled";

/** A default activation target as the activation team keeps it. */
export class DefaultActivationTarget {
  code: string;
  label: string;
  source: string;
  maximum: number;
  approved: boolean;
  ownerId: string;
  pinned: boolean;
  externalRef: string;
  weight: number;
  openRate: number;
  status: DefaultActivationTargetStatus;

  constructor(
    code: string,
    label: string,
    source: string,
    maximum: number,
    approved: boolean,
    ownerId: string,
    pinned: boolean,
    externalRef: string,
    weight: number,
    openRate: number,
    status: DefaultActivationTargetStatus,
  ) {
    this.code = code;
    this.label = label;
    this.source = source;
    this.maximum = maximum;
    this.approved = approved;
    this.ownerId = ownerId;
    this.pinned = pinned;
    this.externalRef = externalRef;
    this.weight = weight;
    this.openRate = openRate;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "cancelled":
        return true;
    }
    return false;
  }

  canMoveTo(next: DefaultActivationTargetStatus): boolean {
    switch (this.status) {
      case "planned":
        switch (next) {
          case "scheduled":
            return true;
        }
        return false;
      case "scheduled":
        return next === "completed" || next === "cancelled";
      case "in_progress":
        return next === "cancelled";
      case "completed":
        switch (next) {
          case "cancelled":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: DefaultActivationTargetStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`default activation target ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"default activation target"} ${this.code}`;
  }

  netLoad(): number {
    return Math.round(this.weight * this.maximum * 100) / 100;
  }

  copy(): DefaultActivationTarget {
    return new DefaultActivationTarget(
      this.code,
      this.label,
      this.source,
      this.maximum,
      this.approved,
      this.ownerId,
      this.pinned,
      this.externalRef,
      this.weight,
      this.openRate,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a default activation target in status planned. */
export function newDefaultActivationTarget(code: string, label: string): DefaultActivationTarget {
  return new DefaultActivationTarget(code, label, "", 0, false, "", false, "", 0, 0, "planned");
}

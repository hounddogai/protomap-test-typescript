import * as text from "../../../../kit/text.js";

/** Where a primary post snapshot is in its life cycle. */
export type PrimaryPostSnapshotStatus = "requested" | "granted" | "revoked" | "expired";

/** One primary post snapshot, with what the planners need to act on it. */
export class PrimaryPostSnapshot {
  code: string;
  label: string;
  priority: number;
  amount: number;
  attributes: Map<string, string>;
  createdAt: number;
  status: PrimaryPostSnapshotStatus;

  constructor(
    code: string,
    label: string,
    priority: number,
    amount: number,
    attributes: Map<string, string>,
    createdAt: number,
    status: PrimaryPostSnapshotStatus,
  ) {
    this.code = code;
    this.label = label;
    this.priority = priority;
    this.amount = amount;
    this.attributes = attributes;
    this.createdAt = createdAt;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: PrimaryPostSnapshotStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "revoked":
            return true;
        }
        return false;
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: PrimaryPostSnapshotStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary post snapshot ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"primary post snapshot"} ${this.code}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  projectedVolume(): number {
    return Math.round((this.amount + this.priority) * 100) / 100;
  }

  copy(): PrimaryPostSnapshot {
    return new PrimaryPostSnapshot(
      this.code,
      this.label,
      this.priority,
      this.amount,
      this.attributes,
      this.createdAt,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a primary post snapshot in status requested. */
export function newPrimaryPostSnapshot(code: string, label: string): PrimaryPostSnapshot {
  return new PrimaryPostSnapshot(code, label, 0, 0, new Map<string, string>(), 0, "requested");
}

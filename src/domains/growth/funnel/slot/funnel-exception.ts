import * as text from "../../../../kit/text.js";

/** Where a funnel exception is in its life cycle. */
export type FunnelExceptionStatus = "requested" | "granted" | "revoked" | "expired";

/** A funnel exception. Its code is unique within a tenant. */
export class FunnelException {
  code: string;
  label: string;
  windowDays: number;
  margin: number;
  visible: boolean;
  attempts: number;
  version: number;
  quantity: number;
  archived: boolean;
  category: string;
  status: FunnelExceptionStatus;

  constructor(
    code: string,
    label: string,
    windowDays: number,
    margin: number,
    visible: boolean,
    attempts: number,
    version: number,
    quantity: number,
    archived: boolean,
    category: string,
    status: FunnelExceptionStatus,
  ) {
    this.code = code;
    this.label = label;
    this.windowDays = windowDays;
    this.margin = margin;
    this.visible = visible;
    this.attempts = attempts;
    this.version = version;
    this.quantity = quantity;
    this.archived = archived;
    this.category = category;
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

  canMoveTo(next: FunnelExceptionStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FunnelExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`funnel exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.version += 1;
  }

  displayLabel(): string {
    return `${this.code} (${this.label})`;
  }

  adjustedLoad(): number {
    return Math.round((this.quantity - this.attempts) * 100) / 100;
  }

  copy(): FunnelException {
    return new FunnelException(
      this.code,
      this.label,
      this.windowDays,
      this.margin,
      this.visible,
      this.attempts,
      this.version,
      this.quantity,
      this.archived,
      this.category,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.category);
  }
}

/** Starts a funnel exception in status requested. */
export function newFunnelException(code: string, label: string): FunnelException {
  return new FunnelException(code, label, 0, 0, false, 0, 0, 0, false, "", "requested");
}

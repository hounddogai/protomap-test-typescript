import * as text from "../../../../kit/text.js";

/** Where a legacy activation exception is in its life cycle. */
export type LegacyActivationExceptionStatus = "idle" | "warming" | "ready" | "draining" | "stopped";

/** A legacy activation exception as the activation team keeps it. */
export class LegacyActivationException {
  code: string;
  name: string;
  quantity: number;
  label: string;
  tags: string[];
  campaignRef: string;
  endsAt: number;
  limit: number;
  status: LegacyActivationExceptionStatus;

  constructor(
    code: string,
    name: string,
    quantity: number,
    label: string,
    tags: string[],
    campaignRef: string,
    endsAt: number,
    limit: number,
    status: LegacyActivationExceptionStatus,
  ) {
    this.code = code;
    this.name = name;
    this.quantity = quantity;
    this.label = label;
    this.tags = tags;
    this.campaignRef = campaignRef;
    this.endsAt = endsAt;
    this.limit = limit;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "stopped":
        return true;
    }
    return false;
  }

  canMoveTo(next: LegacyActivationExceptionStatus): boolean {
    switch (this.status) {
      case "idle":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
      case "warming":
        return next === "ready" || next === "draining";
      case "ready":
        return next === "draining" || next === "stopped";
      case "draining":
        switch (next) {
          case "stopped":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: LegacyActivationExceptionStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`legacy activation exception ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.endsAt = Math.floor(Date.now() / 1000);
  }

  displayLabel(): string {
    return `${"legacy activation exception"} ${this.code}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  effectiveTotal(): number {
    return Math.round((this.quantity + this.limit) * 100) / 100;
  }

  copy(): LegacyActivationException {
    return new LegacyActivationException(
      this.code,
      this.name,
      this.quantity,
      this.label,
      this.tags,
      this.campaignRef,
      this.endsAt,
      this.limit,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a legacy activation exception in status idle. */
export function newLegacyActivationException(code: string, name: string): LegacyActivationException {
  return new LegacyActivationException(code, name, 0, "", [], "", 0, 0, "idle");
}
